import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  breadcrumbSchema,
  organizationSchema,
  type Crumb,
} from "@/seo/config";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  crumbs?: Crumb[];
  jsonLd?: object[];
}

/** Per-page head tags. Canonical and og:url always self-reference the production domain. */
export default function Seo({ title, description, path, type = "website", image = DEFAULT_OG_IMAGE, crumbs, jsonLd = [] }: SeoProps) {
  const url = absoluteUrl(path);
  const schemas: object[] = [organizationSchema, ...jsonLd];
  if (crumbs && crumbs.length > 1) schemas.push(breadcrumbSchema(crumbs));
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="he_IL" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
}

export function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
}
