import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Writable } from "node:stream";
import { AppProviders, AppRoutes } from "./App";
import { staticPages, redirects } from "./seo/pages";
import { knowledgeArticles } from "./data/knowledge";
import { articlesData } from "./data/articlesData";

export { redirects };

/** Every public, indexable URL. Private areas are never listed here. */
export function getPublicRoutes() {
  return [
    ...staticPages.map((p) => ({ path: p.path, changefreq: p.changefreq, priority: p.priority, lastmod: undefined as string | undefined })),
    ...knowledgeArticles.map((a) => ({ path: `/knowledge/${a.slug}`, changefreq: "monthly" as const, priority: a.isPillar ? "0.8" : "0.6", lastmod: a.updatedDate })),
    ...articlesData.map((a) => ({ path: `/blog/${a.slug}`, changefreq: "monthly" as const, priority: "0.5", lastmod: a.publishDate })),
  ];
}

export function render(url: string): Promise<{ html: string; head: string }> {
  HelmetProvider.canUseDOM = false;
  const helmetContext: { helmet?: any } = {};
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) { chunks.push(Buffer.from(chunk)); cb(); },
      final(cb) {
        const html = Buffer.concat(chunks).toString("utf8");
        const h = helmetContext.helmet;
        const head = h ? [h.title, h.meta, h.link, h.script].map((x: any) => x.toString()).join("\n") : "";
        resolve({ html, head });
        cb();
      },
    });
    const stream = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <AppProviders>
          <StaticRouter location={url}>
            <AppRoutes />
          </StaticRouter>
        </AppProviders>
      </HelmetProvider>,
      {
        onAllReady() { stream.pipe(sink); },
        onShellError: reject,
        onError(err) { console.warn(`[prerender] ${url}:`, (err as Error)?.message); },
      },
    );
    setTimeout(() => { stream.abort(); }, 20000);
  });
}
