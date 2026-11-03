import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const directories: string[] = [];
const script = 'scripts/check-commit-message.sh';

function checkMessage(message: string) {
  const directory = mkdtempSync(join(tmpdir(), 'lumen-commit-message-'));
  directories.push(directory);
  const messageFile = join(directory, 'message');
  writeFileSync(messageFile, message);
  return spawnSync('sh', [script, messageFile], { encoding: 'utf8' });
}

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('commit message attribution guard', () => {
  it('ignores comment lines and the verbose commit scissors section', () => {
    const result = checkMessage(
      'fix(common): update controls\n\n# codex generated with an agent\n\n# ------------------------ >8 ------------------------\n# Co-authored-by: Agent <agent@example.com>\n'
    );
    expect(result.status).toBe(0);
  });

  it('rejects prohibited attribution in the actual message', () => {
    const result = checkMessage('fix(common): update controls\n\nGenerated with Codex\n');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('prohibited attribution');
  });
});
