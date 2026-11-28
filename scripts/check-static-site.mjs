import assert from "node:assert/strict";

// Check the published artifact, including project subpaths, rather than trusting
// a successful deployment that may have uploaded the uncompiled source tree.
const pageUrl = new URL(process.argv[2] ?? "http://127.0.0.1:4173/");
const baseUrl = new URL(".", pageUrl);
async function readAsset(reference, from, contentType) {
  const url = new URL(reference, from);
  assert.equal(url.origin, baseUrl.origin, `Unexpected asset origin: ${url}`);
  assert.ok(
    url.pathname.startsWith(baseUrl.pathname),
    `Asset escapes the deployment path: ${url.pathname}`,
  );
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(
    response.status,
    200,
    `${url.pathname}: HTTP ${response.status}`,
  );
  assert.match(
    response.headers.get("content-type") ?? "",
    contentType,
    `Wrong content type for ${url.pathname}`,
  );
  return { url, text: await response.text() };
}

const page = await readAsset(pageUrl.href, pageUrl, /text\/html/);
const scripts = [...page.text.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
assert.ok(scripts.length, "Missing compiled application script");
for (const [, source] of scripts) {
  assert.match(
    source,
    /\.js(?:\?|$)/,
    "Page still serves uncompiled TypeScript",
  );
  await readAsset(source, page.url, /(?:java|ecma)script/);
}
const styles = [...page.text.matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"/g)];
assert.ok(styles.length, "Missing application stylesheet");
for (const [, source] of styles) {
  const css = await readAsset(source, page.url, /text\/css/);
  const fontReferences = [
    ...css.text.matchAll(/url\(["']?([^\s)"']+\.(?:ttf|woff2?))["']?\)/g),
  ];
  assert.ok(fontReferences.length, "Missing self-hosted font references");
  await Promise.all(
    fontReferences.map(([, font]) =>
      readAsset(font, css.url, /font|octet-stream/),
    ),
  );
}
await readAsset("images/interstellar.jpg", baseUrl, /image\/jpeg/);
console.log(`PASS: compiled JavaScript, CSS, fonts and artwork at ${baseUrl}`);
