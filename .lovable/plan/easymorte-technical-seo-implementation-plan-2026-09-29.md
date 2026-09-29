# EasyMorte – Technical SEO Implementation Plan

Goal: make every public page readable by Google, Bing and AI crawlers in its first HTML response. Design, colors, logo, UX, the questionnaire, the client area, admin, payment, Tranzila and backend logic stay exactly as they are.

## Hosting limits to know up front
- **Real 404 status and 301 redirects:** the current hosting sends every unknown URL to the app with status 200. Without a server this can't be changed. What we can do: missing pages get `noindex`, old URLs get an immediate redirect in the browser plus a canonical tag. True 404/301 needs server rendering (the TanStack Start upgrade).
- **Prerendering:** we'll render each public page to static HTML at build time using React's own server renderer. This doesn't need a headless browser, so it runs in the hosting build. The private area stays a normal browser-only app.

## 1. Build-time prerender (public pages only)
- Add an SSR entry (`src/entry-server.tsx`) that renders `<App>` through `StaticRouter` and `HelmetProvider`, and collects head tags.
- Add a post-build script (`scripts/prerender.ts`, run after `vite build`). For each public route it writes `dist/<route>/index.html` with the full body HTML, title, meta, canonical and JSON-LD already filled in. `main.tsx` then uses `hydrateRoot` when the page was prerendered, and `createRoot` otherwise.
- Browser-only code (localStorage, window, Supabase session checks, the ticker, chat, floating widgets) is guarded so it only runs on the client.
- Routes are listed in one file, `src/seo/routes.ts`, generated from the static routes plus every knowledge and blog article slug. The sitemap reads from the same list.
- Never prerendered: /dashboard/*, /admin/*, /advisor/*, /auth, /intake*, /results, /mix-selection/*, /my-cases.

## 2. New and aliased public URLs
New landing pages, all using existing layout components and styles (no new design):
- /first-mortgage, /mortgage (new mortgage), /mortgage-refinance, /mortgage-advisor, /mortgage-tender
- /mortgage-calculator: the existing new-mortgage calculator plus text content around it
- /refinance-calculator: the existing refinance calculator plus text content around it
- /faq: real FAQ content with FAQPage schema
- /privacy and /terms: the existing legal pages at clean URLs

Old URLs (/calculators/new-mortgage, /calculators/refinance, /legal/privacy, /legal/terms, /blog/*) get a canonical tag pointing to the new URL plus a browser-side redirect.

The landing pages need marketing text. It will follow the existing tone ("data over sales", ₪3,450 fixed price, 72-hour file review, no promises about bank timelines).

## 3. Head metadata (per page)
- A shared `<Seo>` component (Helmet) sets a unique title, description, canonical, og:title/description/url/image/type and twitter:card on every page, always on https://easymorte.co.il.
- Homepage title: "משכנתא דיגיטלית, מחזור משכנתא ומכרז בנקים | EasyMorte", with the description you provided.
- Default share image: a fixed file at `/og/easymorte-default.jpg` (1200x630), built from the existing brand/hero asset.
- `twitter:site` is removed because there's no official X account.
- Private routes get `<meta name="robots" content="noindex,nofollow">` from the private layouts, the auth page and the intake pages.
- `index.html`: `<html lang="he" dir="rtl">`, remove any canonical or preview-domain references, and add a placeholder for the Search Console verification meta tag.

## 4. Schema (JSON-LD, real data only)
- Every page: Organization (name EasyMorte, url, logo on the domain, contactPoint with phone 055-996-1997 and email easymorte.il@gmail.com). No sameAs unless you provide real profiles. No ratings or reviews.
- Homepage: WebSite. Service pages: Service. Articles: Article with author, datePublished and dateModified. FAQ page: FAQPage. Every inner page: BreadcrumbList.

## 5. Breadcrumbs, headings and links
- A visual breadcrumb component in the existing typography, plus matching JSON-LD, on every inner public page.
- Check heading order: one H1 per page, then H2/H3 in order. Only heading tag levels change, never visual classes.
- Change important JS-only click handlers on public pages to real `<Link>` anchors.
- Footer (links only, same design): add About, Privacy, Terms, Contact, Knowledge Center, Mortgage Calculator and Mortgage Refinance.

## 6. robots.txt and sitemap.xml
- robots.txt: Allow `/`, Disallow the private paths listed in the request, and add `Sitemap: https://easymorte.co.il/sitemap.xml`.
- `scripts/generate-sitemap.ts` runs before dev and build and writes `public/sitemap.xml` from `src/seo/routes.ts`. It only includes public, canonical URLs, with no query strings. `lastmod` appears only where an article has a real date.

## 7. Performance and images (no visual change)
- `loading="lazy"`, width/height and Hebrew alt text on meaningful images below the fold; the hero image loads eagerly.
- Preconnect and `display=swap` for fonts; defer non-critical widgets (chat, accessibility, ticker) until after hydration.
- Keep the existing route code-splitting.

## 8. Verification and report
- Script: build, serve `dist`, and fetch every public route without JavaScript. Check for 200, H1, body text, internal links, a canonical that matches the URL, unique titles and descriptions, valid JSON-LD, and no noindex. Also validate the sitemap XML (no private or duplicate URLs, no preview domain) and robots.txt.
- Final checks on /, /mortgage-refinance, /first-mortgage, /mortgage-calculator, /about and /knowledge.
- Deliver "EasyMorte Technical SEO Implementation Report" to Files with: prerendered pages, noindex routes, robots and sitemap locations, the canonical list, schema, meta changes, performance changes and remaining risks (404/301 limits, need to publish, Search Console token).

## After approval, from you
- The Search Console verification code (or confirmation that you'll verify by DNS).
- Any real social profiles for sameAs.
- A publish after the work lands. Nothing changes on the live domain until then.
