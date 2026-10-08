/** Single source of truth for the production domain used in canonical/og URLs. */
export const SITE_URL = "https://easymorte.co.il";
export const SITE_NAME = "EasyMorte";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/easymorte-default.jpg`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const absoluteUrl = (path: string) => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "EasyMorte",
  alternateName: "EASY MORTE",
  legalName: "אליס שירותי ייעוץ",
  url: `${SITE_URL}/`,
  logo: LOGO_URL,
  email: "easymorte.il@gmail.com",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+972-55-996-1997",
    email: "easymorte.il@gmail.com",
    contactType: "customer service",
    areaServed: "IL",
    availableLanguage: ["he"],
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "EasyMorte",
  url: `${SITE_URL}/`,
  inLanguage: "he-IL",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const serviceSchema = (name: string, description: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  url: absoluteUrl(path),
  serviceType: name,
  areaServed: { "@type": "Country", name: "Israel" },
  provider: { "@id": `${SITE_URL}/#organization` },
  offers: { "@type": "Offer", price: "3450", priceCurrency: "ILS" },
});

export const faqSchema = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export type Crumb = { name: string; path: string };

export const breadcrumbSchema = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

/** Routes that must never be indexed (client area, admin, auth, intake, payment). */
export const PRIVATE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/advisor",
  "/auth",
  "/login",
  "/signup",
  "/intake",
  "/results",
  "/my-cases",
  "/mix-selection",
  "/for-advisors",
  "/payment",
  "/questionnaire",
  "/documents",
];

export const isPrivatePath = (pathname: string) =>
  PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
