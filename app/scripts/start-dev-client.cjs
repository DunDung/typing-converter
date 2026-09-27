const { execFileSync, spawn } = require('node:child_process');
const path = require('node:path');
let address;
try {
    address = execFileSync('tailscale', ['ip', '-4'], { encoding: 'utf8' }).trim().split('\n')[0];
    if (!/^100\.(?:\d{1,3}\.){2}\d{1,3}$/.test(address)) throw new Error('No Tailscale IPv4');
} catch {
    console.error('Tailscale을 연결한 뒤 다시 실행해 주세요.');
    process.exit(1);
}
const url = `http://${address}:8082/?native=1`;
console.log(`Expo: http://${address}:9000\nWebView: ${url}`);
const child = spawn(process.execPath, [path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli'),
    'start', '--dev-client', '--host', 'lan', '--port', '9000', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: address, EXPO_PUBLIC_CONVERTER_URL: url },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 0));
