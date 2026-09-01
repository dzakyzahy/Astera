import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'app/page.tsx',
  'app/globals.css',
  'public/og-light.png',
  'docs/PRODUCT_BRIEF.md',
  'docs/ARCHITECTURE.md',
  'docs/WALKTHROUGH.md',
  '.openai/hosting.json',
];

const failures = [];

for (const file of requiredFiles) {
  try {
    await access(resolve(root, file));
  } catch {
    failures.push('Missing required project file: ' + file);
  }
}

const page = await readFile(resolve(root, 'app/page.tsx'), 'utf8');

for (const pattern of [
  { name: 'personal team identity', regex: /\b(?:dzaky|diky)\b/i },
  { name: 'unfinished placeholder', regex: /\b(?:lorem ipsum|todo: replace|your company here)\b/i },
  { name: 'private key material', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
]) {
  if (pattern.regex.test(page)) failures.push('app/page.tsx contains ' + pattern.name + '.');
}

for (const requiredCopy of [
  'synthetic data',
  'AI assists. Accountable people decide.',
  'No vendor is dispatched without accountable approval.',
]) {
  if (!page.includes(requiredCopy)) failures.push('Required trust copy is missing: ' + requiredCopy);
}

if (failures.length > 0) {
  console.error('ASTERA verification failed:\n');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('ASTERA verification passed (' + requiredFiles.length + ' required files, trust and anonymity checks).');
