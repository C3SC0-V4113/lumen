import { spawnSync } from 'node:child_process';

function runPnpm(args) {
  return spawnSync('pnpm', args, { stdio: 'inherit' });
}

const start = runPnpm([
  'exec',
  'astro',
  'preview',
  '--background',
  '--host',
  '127.0.0.1',
  '--port',
  '3000',
]);
if (start.status !== 0) process.exit(start.status ?? 1);

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  runPnpm(['exec', 'astro', 'preview', 'stop']);
  process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 60_000);
