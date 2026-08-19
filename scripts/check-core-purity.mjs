#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkgPath = fileURLToPath(new URL('../packages/core/package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const deps = Object.keys(pkg.dependencies ?? {});

if (deps.length > 0) {
  console.error(
    `packages/core/package.json must have zero runtime dependencies (spec §5.1). Found: ${deps.join(', ')}`,
  );
  process.exit(1);
}

console.log('core purity check passed: packages/core has zero runtime dependencies.');
