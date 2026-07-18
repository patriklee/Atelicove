const { spawnSync } = require('child_process');

const command = process.argv[2];
if (!['start', 'build'].includes(command)) {
  process.stderr.write('Usage: node scripts/run-mock.js <start|build>\n');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [require.resolve('react-scripts/bin/react-scripts'), command],
  {
    stdio: 'inherit',
    env: { ...process.env, REACT_APP_USE_MOCK_API: 'true' },
  },
);

process.exit(result.status ?? 1);
