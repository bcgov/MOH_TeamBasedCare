// Instrumentation module for web application
// Read https://nextjs.org/docs/pages/guides/instrumentation for more details
// The register function is called at applications startup

function writeStartupLog(message: string) {
  process.stdout.write(`${message}\n`);
}

export function register() {
  writeStartupLog('Instrumentation registered:');

  if (process.release?.name === 'node') {
    writeStartupLog(`Node.js version: ${process.version}`);
  } else {
    writeStartupLog(`Runtime other than Node.js detected: ${process.release?.name || 'unknown'}`);
  }
}
