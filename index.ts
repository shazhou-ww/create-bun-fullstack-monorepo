#!/usr/bin/env bun
/**
 * Entry point for bun create template
 * This file is executed when bun create is used
 * 
 * Based on Bun create best practices:
 * 1. Copy template directory to target
 * 2. Replace placeholders in template files
 */

import { cp, mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get target directory from command line arguments (resolve to absolute path)
const targetDir = resolve(process.argv[2] || process.cwd());
const templateDir = join(__dirname, 'template');

// Get project name from target directory
const projectName = targetDir.split(/[/\\]/).pop() || 'my-project';

// Get org name from environment variable or use default
const orgName = process.env.ORG_NAME || '@myorg';

// Convert project name to different formats
const projectNameKebab = projectName.toLowerCase().replace(/\s+/g, '-');
const projectNamePascal = projectNameKebab
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

// Replacement mappings
const replacements: Record<string, string> = {
  '{{PROJECT_NAME}}': projectNameKebab,
  '{{PROJECT_NAME_PASCAL}}': projectNamePascal,
  '{{ORG_NAME}}': orgName,
  '{{PROJECT_DESCRIPTION}}': `${projectNamePascal} - Fullstack Monorepo with Bun`,
};

// Directories to skip during replacement
const skipDirs = [
  'node_modules',
  'dist',
  'build',
  '.aws-sam',
  '.turbo',
  'coverage',
  '.git',
  '.bun',
  'bun.lockb',
  '.npm',
];

// Replace placeholders in file content
async function replaceInFile(filePath: string, replacements: Record<string, string>): Promise<void> {
  try {
    let content = await readFile(filePath, 'utf8');
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, value);
    }
    await writeFile(filePath, content, 'utf8');
  } catch (err) {
    // Skip binary files or files that can't be read
    if (err instanceof Error && !err.message.includes('ENOENT')) {
      // Only warn for non-ENOENT errors
    }
  }
}

// Recursively process directory and replace placeholders
async function walkDir(dir: string, replacements: Record<string, string>, skipDirs: string[]): Promise<void> {
  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      // Skip certain directories
      if (
        skipDirs.includes(entry) ||
        (entry.startsWith('.') && entry !== '.git' && entry !== '.github')
      ) {
        continue;
      }

      const filePath = join(dir, entry);
      const statInfo = await stat(filePath);

      if (statInfo.isDirectory()) {
        await walkDir(filePath, replacements, skipDirs);
      } else {
        // Only process text files
        const ext = entry.split('.').pop()?.toLowerCase() || '';
        const textExtensions = [
          'ts',
          'tsx',
          'js',
          'jsx',
          'json',
          'md',
          'yaml',
          'yml',
          'toml',
          'txt',
          'env',
          'html',
          'css',
          'xml',
        ];
        if (textExtensions.includes(ext)) {
          await replaceInFile(filePath, replacements);
        }
      }
    }
  } catch (err) {
    // Directory might not exist or not readable, skip
  }
}

// Special handling for package.json: replace template package name with project name
async function updatePackageJson(pkgJsonPath: string): Promise<void> {
  try {
    const pkgJsonContent = await readFile(pkgJsonPath, 'utf8');
    const pkgJson = JSON.parse(pkgJsonContent);

    // List of possible template package names that should be replaced
    const templatePackageNames = [
      'bun-fullstack-monorepo',
      'create-bun-fullstack-monorepo',
    ];

    // Template description that should be replaced
    const templateDescription = 'A fullstack monorepo template with Bun, TypeScript, AWS Lambda, and React';

    let updated = false;

    // If package.json has the template package name, replace it with project name
    if (pkgJson.name && templatePackageNames.includes(pkgJson.name)) {
      pkgJson.name = projectNameKebab;
      updated = true;
      console.log(`📝 Updated package.json name: ${pkgJson.name} -> ${projectNameKebab}`);
    }

    // If package.json has the template description, replace it with project description
    if (pkgJson.description === templateDescription) {
      pkgJson.description = `${projectNamePascal} - Fullstack Monorepo with Bun`;
      updated = true;
      console.log(`📝 Updated package.json description`);
    }

    if (updated) {
      await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
    }
  } catch (err) {
    // Ignore errors, package.json might not exist or be invalid
    if (err instanceof Error) {
      console.warn(`Warning: Could not update package.json: ${err.message}`);
    }
  }
}

// Main function
async function main() {
  try {
    // Create target directory
    await mkdir(targetDir, { recursive: true });

    // Copy template directory to target
    console.log(`📦 Creating project: ${projectNameKebab}...`);
    console.log(`📂 Template directory: ${templateDir}`);
    
    // Check if template directory exists
    try {
      const templateStat = await stat(templateDir);
      if (!templateStat.isDirectory()) {
        throw new Error('Template path is not a directory');
      }
      const templateFiles = await readdir(templateDir);
      console.log(`📄 Template files: ${templateFiles.join(', ')}`);
    } catch (err) {
      console.error(`❌ Template directory not found: ${templateDir}`);
      console.error(`   Current __dirname: ${__dirname}`);
      process.exit(1);
    }
    
    // Copy template files individually (more reliable across platforms)
    const templateFiles = await readdir(templateDir);
    for (const file of templateFiles) {
      // Skip files that shouldn't be copied
      if (file === 'node_modules' || file === '.git' || file === 'bun.lockb') {
        continue;
      }
      const srcPath = join(templateDir, file);
      const destPath = join(targetDir, file);
      await cp(srcPath, destPath, { recursive: true });
    }
    
    const copiedFiles = await readdir(targetDir);
    console.log(`✅ Copied ${copiedFiles.length} files`);

    // Replace placeholders in all files
    console.log('🔄 Replacing placeholders...');
    await walkDir(targetDir, replacements, skipDirs);

    // Update package.json specifically
    const pkgJsonPath = join(targetDir, 'package.json');
    await updatePackageJson(pkgJsonPath);

    console.log('✅ Project initialized successfully!');
    console.log(`📦 Project name: ${projectNameKebab}`);
    console.log(`🏢 Organization: ${orgName}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. cd ' + targetDir);
    console.log('  2. bun install');
    console.log('  3. bun run create:function <name>  # Create a Lambda function');
    console.log('  4. bun run create:package <name>   # Create a shared package');
    console.log('  5. bun run create:app <name>       # Create a frontend app');
  } catch (error) {
    console.error('❌ Error creating project:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

