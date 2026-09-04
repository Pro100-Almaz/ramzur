/*
  Regenerates ramzur-landing-single-file.html from index.html + style.css +
  script.js, so the portable one-file copy of the site can never drift from
  the three source files.

  Run:  node build-single-file.mjs
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SRC = 'index.html';
const OUT = 'ramzur-landing-single-file.html';

const html = readFileSync(SRC, 'utf8');
const css = readFileSync('style.css', 'utf8');
const js = readFileSync('script.js', 'utf8');

/*
  The point of this file is that it opens with nothing beside it, so the tab
  icons are embedded as data URIs too. Left as plain hrefs they would resolve
  against wherever the single file happens to sit and quietly 404, leaving the
  browser's default globe in the tab.
*/
const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString('base64')}`;

const icons = [
  ['favicon.ico', 'image/x-icon'],
  ['favicon.svg', 'image/svg+xml'],
  ['apple-touch-icon.png', 'image/png'],
];

const linkTag = '<link rel="stylesheet" href="style.css">';
const scriptTag = '<script src="script.js" defer></script>';

for (const [tag, name] of [[linkTag, 'style.css link'], [scriptTag, 'script.js tag']]) {
  if (!html.includes(tag)) {
    console.error(`build failed: could not find the ${name} in ${SRC}`);
    process.exit(1);
  }
}

/*
  The source tag is `defer`, and the lead modal's markup sits *after* it in
  index.html. `defer` is ignored on an inline script, so inlining the file
  as-is would run it before the modal existed and leave every CTA dead.
  Wrapping in DOMContentLoaded reproduces the deferred timing regardless of
  where the tag ends up.

  Only the behaviour is wrapped, though. script.js opens with the TELEGRAM
  settings block, which touches no DOM and has no reason to be deferred —
  and burying it inside the listener would make it closure-scoped, so the
  bundle would behave differently from index.html and the settings could not
  be inspected from the console. Splitting at the IIFE keeps the two builds
  identical.
*/
const IIFE = "(function(){";
const split = js.indexOf(IIFE);
if (split < 0) {
  console.error('build failed: could not find the top-level IIFE in script.js');
  process.exit(1);
}
const settings = js.slice(0, split);   // TELEGRAM config, stays at top level
const behaviour = js.slice(split);     // everything else, deferred

const deferred = `<script>\n${settings}\n`
  + `document.addEventListener('DOMContentLoaded', function(){\n${behaviour}\n});\n`
  + `</script>`;

let bundled = html
  .replace(linkTag, `<style>\n${css}\n</style>`)
  .replace(scriptTag, deferred);

for (const [file, mime] of icons) {
  if (!existsSync(file)) {
    console.error(`build failed: ${file} is missing — run \`node build-icons.mjs\` first`);
    process.exit(1);
  }
  const before = bundled;
  bundled = bundled.replace(`href="${file}"`, `href="${dataUri(file, mime)}"`);
  if (bundled === before) {
    console.error(`build failed: no href="${file}" found in ${SRC}`);
    process.exit(1);
  }
}

writeFileSync(OUT, bundled);
console.log(`${OUT} — ${bundled.split('\n').length} lines, ${(bundled.length / 1024).toFixed(1)} KB`);
