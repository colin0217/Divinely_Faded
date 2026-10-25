import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {parse} from 'parse5';

const root = process.cwd();
const routes = JSON.parse(fs.readFileSync(path.join(root, 'scripts/site-routes.json'), 'utf8'));
const config = (await import(new URL('../next.config.mjs', import.meta.url))).default;
const redirects = config.redirects ? await config.redirects() : [];
const nodes = (node, tag) => [...(node.tagName === tag ? [node] : []), ...(node.childNodes || []).flatMap(n => nodes(n, tag))];
const attrs = node => Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
const text = node => node?.nodeName === '#text' ? node.value : (node?.childNodes || []).map(text).join('');
let server;
let origin = process.argv[2];
if (!origin) {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {stdio: 'pipe'});
  server.stderr.on('data', data => process.stderr.write(data));
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  for (let i = 0; ; i++) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (i >= 100 || server?.exitCode !== null && server?.exitCode !== undefined) throw Error('Production server did not start');
    await sleep(100);
  }
  const links = new Set();
  const assets = new Set();
  for (const route of routes) {
    const response = await fetch(origin + route.route, {redirect: 'manual'});
    const redirect = redirects.find(r => r.source === route.route && !r.has);
    if (redirect) {
      assert([307, 308].includes(response.status), `${route.route}: redirect status`);
      assert.equal(new URL(response.headers.get('location'), origin).pathname + new URL(response.headers.get('location'), origin).hash, redirect.destination);
      continue;
    }
    assert.equal(response.status, 200, `${route.route}: status`);
    const html = await response.text();
    const doc = parse(html);
    assert.equal(attrs(nodes(doc, 'html')[0]).lang, route.lang, `${route.route}: document language`);
    assert.equal(nodes(doc, 'h1').length, 1, `${route.route}: exactly one main heading`);
    assert(text(nodes(doc, 'title')[0]).trim(), `${route.route}: title`);
    assert(nodes(doc, 'meta').some(n => attrs(n).name === 'description' && attrs(n).content?.trim()), `${route.route}: description`);
    const canonical = nodes(doc, 'link').find(n => attrs(n).rel === 'canonical');
    assert(canonical, `${route.route}: canonical`);
    const publicUrl = new URL(attrs(canonical).href);
    assert.equal(publicUrl.pathname, route.route, `${route.route}: canonical path`); // trailingSlash: true
    for (const script of nodes(doc, 'script').filter(n => attrs(n).type === 'application/ld+json')) JSON.parse(text(script));
    assert(!/\sdata-dg-(?:src|content|index)=/.test(html), `${route.route}: editor markers in production`);
    for (const a of nodes(doc, 'a')) {
      const href = attrs(a).href;
      if (!href || /^(?:tel:|mailto:|#|javascript:)/.test(href)) continue;
      const url = new URL(href, publicUrl);
      if (url.origin === publicUrl.origin) links.add(url.pathname + url.search);
    }
    for (const tag of ['img', 'source', 'video', 'audio', 'script', 'link']) for (const n of nodes(doc, tag)) {
      const a = attrs(n);
      const refs = [a.src, a.poster, ...(tag === 'link' && ['stylesheet', 'icon', 'apple-touch-icon', 'preload'].includes(a.rel) ? [a.href] : [])];
      for (const ref of refs.filter(Boolean)) if (ref.startsWith('/') && !ref.startsWith('//')) assets.add(ref);
    }
    const output = path.join(root, '.qa-html', route.source);
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, html);
  }
  // Blog (route handlers serving the generator's date-gated HTML): hubs and every live post answer 200.
  for (const base of ['blog', 'es/blog']) {
    const dir = path.join(root, '.blog-html', base);
    if (!fs.existsSync(dir)) continue;
    assert.equal((await fetch(`${origin}/${base}/`)).status, 200, `/${base}/: status`);
    for (const slug of fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'index.html')))) assert.equal((await fetch(`${origin}/${base}/${slug}/`)).status, 200, `/${base}/${slug}/: status`);
  }
  for (const href of links) assert((await fetch(origin + href)).ok, `Broken internal link: ${href}`);
  for (const src of assets) assert((await fetch(origin + src)).ok, `Missing asset: ${src}`);
  const missing = await fetch(origin + '/__page_that_does_not_exist__');
  assert.equal(missing.status, 404, 'Unknown routes return 404');
  fs.mkdirSync(path.join(root, '.qa-html'), {recursive: true});
  fs.writeFileSync(path.join(root, '.qa-html/404.html'), await missing.text());
  if (fs.existsSync(path.join(root, 'pages/api/contact.js'))) {
    assert.equal((await fetch(origin + '/api/contact')).status, 405, 'Contact handler rejects GET');
    assert.equal((await fetch(origin + '/api/contact', {method:'POST',headers:{'content-type':'application/json',origin:'https://other.example.test'},body:'{}'})).status, 403, 'Contact handler checks origin');
    assert.equal((await fetch(origin + '/api/contact', {method:'POST',headers:{'content-type':'application/json',origin:'https://permianmedia.com'},body:'{}'})).status, 400, 'Contact handler rejects invalid data before contacting a provider');
  }
  // The bilingual SEO/content gate (tools/check.js) runs on the static site before migration; it is not re-run here.
  console.log(`Verified ${routes.length} routes, ${links.size} internal links, ${assets.size} assets, language/SEO metadata and 404 behavior.`);
} finally {
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exited;
  }
}
