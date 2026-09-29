// Build-time prerender for PUBLIC routes only. Runs after `vite build` + SSR build.
// Writes dist/<route>/index.html with full HTML + head tags, plus sitemap.xml.
// Never fails the build: on any error the SPA build stays intact.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const SITE_URL = "https://easymorte.co.il";
const DIST = resolve(process.env.PRERENDER_DIST || "dist");
const SSR_DIR = resolve(process.env.PRERENDER_SSR || "dist-ssr");

// Minimal browser globals so modules that touch storage at import time can load in Node.
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
globalThis.localStorage ??= mem();
globalThis.sessionStorage ??= mem();

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function writeSitemap(routes) {
  const seen = new Set();
  const urls = routes
    .filter((r) => !seen.has(r.path) && seen.add(r.path))
    .map((r) => {
      const loc = r.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${r.path}`;
      const lastmod = r.lastmod && /^\d{4}-\d{2}-\d{2}$/.test(r.lastmod) ? `\n    <lastmod>${r.lastmod}</lastmod>` : "";
      const cf = r.changefreq ? `\n    <changefreq>${r.changefreq}</changefreq>` : "";
      const pr = r.priority ? `\n    <priority>${r.priority}</priority>` : "";
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}${cf}${pr}\n  </url>`;
    });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync(join(DIST, "sitemap.xml"), xml);
  if (process.env.PRERENDER_WRITE_PUBLIC) writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`[prerender] sitemap.xml: ${urls.length} URLs`);
}

function stripDefaultHead(tpl) {
  return tpl
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:(title|description|url|image|type)"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:(card|title|description|image)"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
}

function outFile(path) {
  return path === "/" ? join(DIST, "index.html") : join(DIST, path.replace(/^\//, ""), "index.html");
}

async function main() {
  const entry = join(SSR_DIR, "entry-server.js");
  if (!existsSync(entry)) { console.warn("[prerender] SSR bundle missing, skipping"); return; }
  const template = readFileSync(join(DIST, "index.html"), "utf8");
  // Keep an untouched SPA shell for private/unknown routes.
  writeFileSync(join(DIST, "spa.html"), template);
  const base = stripDefaultHead(template);
  const { render, getPublicRoutes, redirects } = await import(pathToFileURL(entry).href);
  const routes = getPublicRoutes();
  writeSitemap(routes);

  let ok = 0, failed = 0;
  for (const r of routes) {
    try {
      const { html, head } = await render(r.path);
      if (!html.includes("<h1")) throw new Error("no <h1> rendered");
      const page = base.replace("</head>", `${head}\n</head>`).replace('<div id="root"></div>', `<div id="root" data-prerendered="${r.path}">${html}</div>`);
      const file = outFile(r.path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, page);
      ok++;
    } catch (e) {
      failed++;
      console.warn(`[prerender] failed ${r.path}: ${e?.message}`);
    }
  }
  // Old URLs: static meta-refresh + canonical so crawlers consolidate on the new URL.
  for (const [from, to] of Object.entries(redirects)) {
    const target = `${SITE_URL}${to}`;
    const file = outFile(from);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `<!doctype html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><title>הועבר</title><link rel="canonical" href="${target}"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${to}"><script>location.replace(${JSON.stringify(to)})</script></head><body><a href="${to}">המשך לעמוד</a></body></html>`);
  }
  console.log(`[prerender] ${ok} pages prerendered, ${failed} failed, ${Object.keys(redirects).length} redirects`);
  rmSync(SSR_DIR, { recursive: true, force: true });
}

main().then(() => process.exit(0)).catch((e) => { console.warn("[prerender] skipped:", e?.message); process.exit(0); });
