#!/usr/bin/env node
/**
 * Prepublish script: Replace placeholders in package.json before publishing to npm
 * This ensures the package.json has a valid name for npm, while the template
 * files still contain placeholders that will be replaced when users create projects.
 */

const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packageJsonPath = join(__dirname, '..', 'package.json');

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  // Replace placeholders with actual values for npm publish
  packageJson.name = 'bun-fullstack-monorepo';
  packageJson.description = 'A fullstack monorepo template with Bun, TypeScript, AWS Lambda, and React';

  // Remove private field if it exists (or set to false)
  if (packageJson.private === true) {
    delete packageJson.private;
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log('✅ package.json prepared for npm publish');
  console.log(`   - name: ${packageJson.name}`);
  console.log(`   - description: ${packageJson.description}`);
} catch (err) {
  console.error('❌ Error preparing package.json for publish:', err.message);
  process.exit(1);
}

