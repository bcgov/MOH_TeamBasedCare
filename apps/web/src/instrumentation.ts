// Instrumentation module for web application
// Read https://nextjs.org/docs/pages/guides/instrumentation for more details
// The register function is called at applications startup

export function register() {
    console.log('Instrumentation registered:');

    if (process.release?.name === 'node') {
        console.log(`Node.js version: ${process.version}`);
    } else {
        console.log(`Runtime other than Node.js detected: ${process.release?.name || 'unknown'}`);
    }
}