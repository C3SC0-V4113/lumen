import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function check(message: string) {
  const directory = mkdtempSync(join(tmpdir(), 'lumen-commit-message-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'message');
  writeFileSync(file, message);
  return spawnSync('sh', ['scripts/check-commit-message.sh', file], { encoding: 'utf8' });
}

describe('commit message attribution guard', () => {
  it('accepts a conventional commit message', () => {
    expect(check('feat(theme): add surface palettes\n').status).toBe(0);
  });

  it.each([
    'Co-authored-by: Person <person@example.test>',
    'Made with Claude',
    'Codex generated this change',
    'OpenCode contribution',
    'Generated with a tool',
  ])('rejects prohibited attribution text', (message) => {
    expect(check(message).status).toBe(1);
  });
});
