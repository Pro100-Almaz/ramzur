/*
  Regenerates ramzur-landing-single-file.html from index.html + style.css +
  script.js, so the portable one-file copy of the site can never drift from
  the three source files.

  Run:  node build-single-file.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'index.html';
const OUT = 'ramzur-landing-single-file.html';

const html = readFileSync(SRC, 'utf8');
const css = readFileSync('style.css', 'utf8');
const js = readFileSync('script.js', 'utf8');

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
*/
const deferred = `<script>\ndocument.addEventListener('DOMContentLoaded', function(){\n${js}\n});\n</script>`;

const bundled = html
  .replace(linkTag, `<style>\n${css}\n</style>`)
  .replace(scriptTag, deferred);

writeFileSync(OUT, bundled);
console.log(`${OUT} — ${bundled.split('\n').length} lines, ${(bundled.length / 1024).toFixed(1)} KB`);
