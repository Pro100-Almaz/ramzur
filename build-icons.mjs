/*
  Regenerates favicon.ico and apple-touch-icon.png from favicon.svg, so all
  the tab icons come from one source and cannot drift apart.

  An .ico cannot sensibly be hand-edited, which is the main reason this exists.
  Rasterising uses the Chrome already installed on the machine — no dependencies.

  Run:  node build-icons.mjs
*/
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222 + Math.floor(Math.random() * 400);
const SRC = 'favicon.svg';

if (!existsSync(SRC)) {
  console.error(`build failed: ${SRC} not found`);
  process.exit(1);
}
if (!existsSync(CHROME)) {
  console.error(`build failed: Chrome not found at ${CHROME}`);
  console.error('set CHROME_PATH to your Chrome binary and retry');
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', `--user-data-dir=/tmp/ramzur-icons-${PORT}`,
  `--remote-debugging-port=${PORT}`, 'about:blank',
], { stdio: 'ignore' });

let target;
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch {}
  await sleep(200);
}
if (!target) { console.error('build failed: Chrome did not start'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id; pending.set(n, { res, rej });
  ws.send(JSON.stringify({ id: n, method, params }));
});
await send('Page.enable');

const svg = readFileSync(SRC, 'utf8');
// iOS masks the touch icon itself, so that one is full-bleed with no radius
const svgSquare = svg.replace(/rx="[\d.]+"/, 'rx="0"');

async function render(svgText, size) {
  const html = `<!DOCTYPE html><meta charset="utf-8">`
    + `<style>html,body{margin:0;padding:0;background:transparent}`
    + `svg{display:block;width:${size}px;height:${size}px}</style>${svgText}`;
  await send('Emulation.setDeviceMetricsOverride',
    { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride',
    { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send('Page.navigate',
    { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
  await sleep(400);
  const cap = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  });
  return Buffer.from(cap.data, 'base64');
}

/* ICO container holding PNG-encoded entries (supported since Windows Vista) */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);     // width  (0 means 256)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt8(0, o + 2);              // palette size
    dir.writeUInt8(0, o + 3);              // reserved
    dir.writeUInt16LE(1, o + 4);           // colour planes
    dir.writeUInt16LE(32, o + 6);          // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  });
  return Buffer.concat([header, dir, ...entries.map(e => e.buf)]);
}

const png16 = await render(svg, 16);
const png32 = await render(svg, 32);
const touch = await render(svgSquare, 180);

const ico = buildIco([{ size: 16, buf: png16 }, { size: 32, buf: png32 }]);
writeFileSync('favicon.ico', ico);
writeFileSync('apple-touch-icon.png', touch);

const kb = b => (b.length / 1024).toFixed(1) + ' KB';
console.log(`favicon.ico          16 + 32     ${kb(ico)}`);
console.log(`apple-touch-icon.png 180x180     ${kb(touch)}`);
console.log(`(favicon.svg is the source — ${kb(Buffer.from(svg))})`);

ws.close();
chrome.kill();
