#!/usr/bin/env bun

// Merge all function template.yaml files into a single SAM template
//
// This script reads the base template.yaml and merges in each function's
// template.yaml from functions/<name>/template.yaml
//
// Output: merged-template.yaml in root directory (so CodeUri paths resolve correctly)

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = (import.meta as { dir?: string }).dir || dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const functionsDir = join(rootDir, 'functions');
// Output to root directory so CodeUri paths resolve correctly relative to template location
const outputFile = join(rootDir, 'merged-template.yaml');

// Read base template
const baseTemplatePath = join(rootDir, 'template.yaml');
if (!existsSync(baseTemplatePath)) {
  console.error('Error: template.yaml not found');
  process.exit(1);
}

let baseTemplate = readFileSync(baseTemplatePath, 'utf8');

// Collect all function templates
const functionResources: string[] = [];

if (existsSync(functionsDir)) {
  const functions = readdirSync(functionsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const fn of functions) {
    const fnTemplatePath = join(functionsDir, fn, 'template.yaml');
    if (existsSync(fnTemplatePath)) {
      const fnTemplate = readFileSync(fnTemplatePath, 'utf8');
      // Remove comments and empty lines at the start
      const cleanedTemplate = fnTemplate
        .split('\n')
        .filter((line) => !line.trim().startsWith('#') || line.trim() === '')
        .join('\n')
        .trim();

      if (cleanedTemplate) {
        // Indent each line with 2 spaces for YAML structure under Resources
        const indentedTemplate = cleanedTemplate
          .split('\n')
          .map((line) => (line.trim() ? `  ${line}` : line))
          .join('\n');
        functionResources.push(indentedTemplate);
      }
      console.log(`  Merged: functions/${fn}/template.yaml`);
    }
  }
}

if (functionResources.length === 0) {
  console.log('No function templates found. Using base template as-is.');
} else {
  console.log(`Merged ${functionResources.length} function template(s)`);

  // Remove placeholder if present
  const placeholderPattern =
    /\s*# Placeholder resource \(remove after adding first function\)\s*\n\s*Placeholder:\s*\n\s*Type: AWS::CloudFormation::WaitConditionHandle\s*\n?/;
  baseTemplate = baseTemplate.replace(placeholderPattern, '\n');

  // Find where to insert resources (after "Resources:" line and any comment)
  const resourcesPattern = /(Resources:\s*\n)(\s*# Functions will be added here by create-function script\s*\n)?/;
  const resourcesMatch = baseTemplate.match(resourcesPattern);

  if (resourcesMatch) {
    const insertPoint = resourcesMatch.index! + resourcesMatch[0].length;
    const before = baseTemplate.slice(0, insertPoint);
    const after = baseTemplate.slice(insertPoint);

    baseTemplate = before + functionResources.join('\n\n') + '\n' + after;
  } else if (baseTemplate.includes('Resources:')) {
    // Resources exists but doesn't match our pattern, insert after it
    baseTemplate = baseTemplate.replace(
      /(Resources:\s*\n)/,
      `$1${functionResources.join('\n\n')}\n`
    );
  } else {
    // No Resources section, add one
    baseTemplate += `\nResources:\n${functionResources.join('\n\n')}\n`;
  }

  // Uncomment Outputs section if it's commented
  const commentedOutputsPattern =
    /# Outputs:\s*\n#\s+ApiGatewayApi:\s*\n#\s+Description: API Gateway endpoint URL\s*\n#\s+Value: !Sub https:\/\/\$\{ServerlessRestApi\}\.execute-api\.\$\{AWS::Region\}\.amazonaws\.com\/Prod\//;
  if (commentedOutputsPattern.test(baseTemplate)) {
    baseTemplate = baseTemplate.replace(
      commentedOutputsPattern,
      `Outputs:
  ApiGatewayApi:
    Description: API Gateway endpoint URL
    Value: !Sub https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/`
    );
  }
}

// Write merged template
writeFileSync(outputFile, baseTemplate, 'utf8');
console.log(`Output: ${outputFile}`);

