#!/usr/bin/env bun
/**
 * Entry point for bun create template
 * This file is executed when bun create is used
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get project name from command line arguments or current directory
const projectName = process.argv[2] || process.cwd().split(/[/\\]/).pop() || 'my-project';

// Run init script
try {
  const initScript = join(__dirname, 'scripts', 'init.ts');
  execSync(`bun run ${initScript} ${projectName}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('Error initializing project:', error.message);
  process.exit(1);
}

