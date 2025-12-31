#!/usr/bin/env bun

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Bun provides import.meta.dir, but TypeScript doesn't know about it
// Use fileURLToPath as fallback for type safety
const __dirname = (import.meta as { dir?: string }).dir || dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

type CreateType = 'function' | 'package' | 'app';

const type = process.argv[2] as CreateType;
const name = process.argv[3];

if (!type || !['function', 'package', 'app'].includes(type)) {
  console.error('Usage: bun scripts/create.ts <function|package|app> <name>');
  process.exit(1);
}

if (!name) {
  console.error(`Usage: bun scripts/create.ts ${type} <name>`);
  process.exit(1);
}

const targetDir = join(rootDir, `${type}s`, name);
const templateDir = join(rootDir, 'templates', type);

if (existsSync(targetDir)) {
  console.error(
    `${type === 'function' ? 'Function' : type === 'package' ? 'Package' : 'App'} ${name} already exists!`
  );
  process.exit(1);
}

console.log(`Creating ${type}: ${name}...`);

// Copy directory recursively (cross-platform)
function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(templateDir, targetDir);

// Replace placeholders
function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  let content = readFileSync(filePath, 'utf8');
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  writeFileSync(filePath, content, 'utf8');
}

function pascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Read org name from package.json (should be set by init.ts)
let orgName = '@myorg';
try {
  const pkgJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  // Try to extract org name from any existing package name
  // This is a fallback, ideally init.ts should set it
  if (pkgJson.name && pkgJson.name.startsWith('@')) {
    orgName = pkgJson.name.split('/')[0];
  }
} catch {
  // Use default
}

const replacements: Record<string, string> = {
  '{{name}}': name,
  '{{ORG_NAME}}': orgName,
};

if (type === 'function') {
  replacements['{{NamePascal}}'] = pascalCase(name);
}

// Replace in all files
function walkDir(dir: string): void {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      try {
        replaceInFile(filePath, replacements);
      } catch (err: unknown) {
        // Skip binary files
        if (err instanceof Error && (err as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Warning: Could not process ${filePath}: ${err.message}`);
        }
      }
    }
  });
}

walkDir(targetDir);

// Type-specific post-processing
if (type === 'function') {
  // Update SAM template
  const samTemplatePath = join(rootDir, 'template.yaml');
  try {
    if (existsSync(samTemplatePath)) {
      let templateContent = readFileSync(samTemplatePath, 'utf8');

      const functionResourceName = `${pascalCase(name)}Function`;
      if (templateContent.includes(`${functionResourceName}:`)) {
        console.warn(`Warning: Function ${functionResourceName} already exists in template.yaml`);
      } else {
        const functionYaml = `  ${functionResourceName}:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/${name}/dist
      Handler: index.handler
      Runtime: nodejs24.x
      Environment:
        Variables:
          NODE_ENV: \${Env:NODE_ENV,prod}
      Events:
        Api:
          Type: Api
          Properties:
            Path: /${name}
            Method: GET
`;

        const placeholderPattern =
          /\s*# Placeholder resource \(remove after adding first function\)\s*\n\s*Placeholder:\s*\n\s*Type: AWS::CloudFormation::WaitConditionHandle\s*\n?/;
        templateContent = templateContent.replace(placeholderPattern, '\n');

        const commentedOutputsPattern =
          /# Outputs:\s*\n#\s+ApiGatewayApi:\s*\n#\s+Description: API Gateway endpoint URL\s*\n#\s+Value: !Sub https:\/\/\$\{ServerlessRestApi\}\.execute-api\.\$\{AWS::Region\}\.amazonaws\.com\/Prod\//;
        if (commentedOutputsPattern.test(templateContent)) {
          templateContent = templateContent.replace(
            commentedOutputsPattern,
            `Outputs:
  ApiGatewayApi:
    Description: API Gateway endpoint URL
    Value: !Sub https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/`
          );
        }

        const resourcesCommentPattern =
          /(Resources:\s*\n\s*# Functions will be added here by create-function script\s*\n)/;
        if (resourcesCommentPattern.test(templateContent)) {
          templateContent = templateContent.replace(
            resourcesCommentPattern,
            `Resources:\n${functionYaml}`
          );
        } else if (templateContent.includes('Resources:')) {
          if (templateContent.includes('\nOutputs:')) {
            templateContent = templateContent.replace(/(\nOutputs:)/, `\n${functionYaml}$1`);
          } else {
            const resourcesMatch = templateContent.match(/(Resources:\s*\n)/);
            if (resourcesMatch) {
              templateContent = templateContent.replace(
                resourcesMatch[1],
                resourcesMatch[1] + functionYaml
              );
            }
          }
        } else {
          if (templateContent.includes('\nOutputs:')) {
            templateContent = templateContent.replace(
              /(\nOutputs:)/,
              `\nResources:\n${functionYaml}$1`
            );
          } else {
            templateContent += `\nResources:\n${functionYaml}`;
          }
        }

        writeFileSync(samTemplatePath, templateContent, 'utf8');
        console.log('Updated template.yaml');
      }
    } else {
      console.log(
        'template.yaml not found. Please create it manually or run this script again after creating it.'
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn(`Warning: Could not update template.yaml: ${err.message}`);
    }
  }

  console.log(`Function ${name} created successfully!`);
  console.log(`Next steps:`);
  console.log(`  cd functions/${name}`);
  console.log(`  bun install`);
  console.log(`  bun run build  # Build the function before deploying`);
} else if (type === 'package') {
  console.log(`Package ${name} created successfully!`);
  console.log(`Next steps:`);
  console.log(`  cd packages/${name}`);
  console.log(`  bun install`);
} else if (type === 'app') {
  console.log(`App ${name} created successfully!`);
  console.log(`Next steps:`);
  console.log(`  cd apps/${name}`);
  console.log(`  bun install`);
  console.log(`  bun run dev`);
}

