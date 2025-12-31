#!/usr/bin/env bun
/**
 * Bun create template initialization script
 * This script replaces placeholders in the template files with actual project values
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Get project name from current directory or argument
const projectName = process.argv[2] || process.cwd().split(/[/\\]/).pop() || 'my-project';

// Get org name from environment variable or prompt for it
// For bun create, we can use env var or extract from package.json if it exists
let orgName = process.env.ORG_NAME || '@myorg';

// If package.json exists and has a name starting with @, use that
try {
  const pkgJsonPath = join(process.cwd(), 'package.json');
  if (readFileSync(pkgJsonPath, 'utf8')) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    if (pkgJson.name && pkgJson.name.startsWith('@')) {
      orgName = pkgJson.name.split('/')[0];
    }
  }
} catch {
  // Use default or env var
}

// Convert project name to different formats
const projectNameKebab = projectName.toLowerCase().replace(/\s+/g, '-');
const projectNamePascal = projectNameKebab
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

// Replace function
function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  try {
    let content = readFileSync(filePath, 'utf8');
    for (const [placeholder, value] of Object.entries(replacements)) {
      // Use global replace to replace all occurrences
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, value);
    }
    writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    // Skip binary files or files that can't be read
    if (err instanceof Error && !err.message.includes('ENOENT')) {
      // Only warn for non-ENOENT errors (file not found is OK)
    }
  }
}

// Recursively process directory
function walkDir(dir: string, replacements: Record<string, string>, skipDirs: string[]): void {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      // Skip certain directories
      if (
        skipDirs.includes(entry) ||
        entry.startsWith('.') && entry !== '.git' && entry !== '.github'
      ) {
        continue;
      }

      const filePath = join(dir, entry);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, replacements, skipDirs);
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
          replaceInFile(filePath, replacements);
        }
      }
    }
  } catch (err) {
    // Directory might not exist or not readable, skip
  }
}

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
];

// Process current directory
walkDir(process.cwd(), replacements, skipDirs);

// Special handling for package.json: replace template package name with project name
// This handles the case where package.json was published with actual package name
// instead of placeholder (e.g., "bun-fullstack-monorepo" -> "my-project")
try {
  const pkgJsonPath = join(process.cwd(), 'package.json');
  const pkgJsonContent = readFileSync(pkgJsonPath, 'utf8');
  const pkgJson = JSON.parse(pkgJsonContent);
  
  // List of possible template package names that should be replaced
  const templatePackageNames = [
    'bun-fullstack-monorepo',
    'create-bun-fullstack-monorepo',
  ];
  
  // If package.json has the template package name, replace it with project name
  if (pkgJson.name && templatePackageNames.includes(pkgJson.name)) {
    const oldName = pkgJson.name;
    pkgJson.name = projectNameKebab;
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
    console.log(`📝 Updated package.json name: ${oldName} -> ${projectNameKebab}`);
  }
} catch (err) {
  // Ignore errors, package.json might not exist or be invalid
  if (err instanceof Error) {
    console.warn(`Warning: Could not update package.json name: ${err.message}`);
  }
}

console.log('✅ Project initialized successfully!');
console.log(`📦 Project name: ${projectNameKebab}`);
console.log(`🏢 Organization: ${orgName}`);
console.log('');
console.log('Next steps:');
console.log('  1. bun install');
console.log('  2. bun run create:function <name>  # Create a Lambda function');
console.log('  3. bun run create:package <name>   # Create a shared package');
console.log('  4. bun run create:app <name>       # Create a frontend app');

