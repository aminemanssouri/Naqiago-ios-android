/**
 * This script patches react-native-xcode.sh to redirect Hermes compiler
 * stderr output to stdout. This prevents Xcode 16.3+ from treating
 * Hermes warnings (written to stderr) as build errors, which causes
 * "Command PhaseScriptExecution emitted errors but did not return a
 * nonzero exit code" and ARCHIVE FAILED.
 */
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'scripts',
  'react-native-xcode.sh'
);

if (!fs.existsSync(SCRIPT_PATH)) {
  console.log('⚠️  react-native-xcode.sh not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(SCRIPT_PATH, 'utf8');

if (content.includes('# PATCHED: suppress hermes warnings')) {
  console.log('ℹ️  react-native-xcode.sh already patched.');
  process.exit(0);
}

// Redirect stderr to stdout for the Hermes compilation command
// This prevents Xcode from detecting Hermes warnings as errors
content = content.replace(
  /"\$HERMES_CLI_PATH" -emit-binary/g,
  '"$HERMES_CLI_PATH" -emit-binary'
);

// Add stderr redirect after set -x -e to cover all commands in the script
content = content.replace(
  'set -x -e',
  '# PATCHED: suppress hermes warnings\nset -x -e\nexec 2>&1'
);

fs.writeFileSync(SCRIPT_PATH, content);
console.log('✅ Patched react-native-xcode.sh to suppress Hermes stderr warnings.');
