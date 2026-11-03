import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    })
  );
  return nested.flat();
}

const files = await filesIn('dist');
const executableFiles = files.filter((file) => !file.endsWith('.map'));
const leakedScript = await Promise.all(
  executableFiles.map(async (file) => ({
    file,
    content: await readFile(file, 'utf8').catch(() => ''),
  }))
).then((contents) => contents.find(({ content }) => content.includes('unpkg.com/react-scan')));

if (!files.length) throw new Error('The production build did not emit files in dist/.');
if (leakedScript) {
  throw new Error(
    `Development-only React Scan leaked into production output: ${leakedScript.file}`
  );
}
