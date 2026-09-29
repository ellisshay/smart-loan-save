import { useLocation } from "react-router-dom";
import Seo from "./Seo";
import Breadcrumbs from "./Breadcrumbs";
import { CalculatorSeoContent } from "./SeoBlocks";
import { crumbsFor, staticPageMap } from "@/seo/pages";
import { calculatorContent, generalFaqs, landingContent } from "@/seo/landingContent";
import { faqSchema, serviceSchema, websiteSchema } from "@/seo/config";

/** Head tags + visual breadcrumbs for static public routes. Dynamic pages (articles) render their own <Seo>. */
export function RouteSeoHead() {
  const { pathname } = useLocation();
  const meta = staticPageMap[pathname];
  if (!meta) return null;
  const crumbs = crumbsFor(pathname);
  const jsonLd: object[] = [];
  if (pathname === "/") jsonLd.push(websiteSchema);
  if (meta.service) jsonLd.push(serviceSchema(meta.label, meta.description, pathname));
  const faqs = landingContent[pathname]?.faqs ?? calculatorContent[pathname]?.faqs ?? (pathname === "/faq" ? generalFaqs : undefined);
  if (faqs) jsonLd.push(faqSchema(faqs));
  return (
    <>
      <Seo title={meta.title} description={meta.description} path={pathname} crumbs={crumbs} jsonLd={jsonLd} />
      {pathname !== "/" && <Breadcrumbs crumbs={crumbs} />}
    </>
  );
}

export function RouteSeoFooterContent() {
  const { pathname } = useLocation();
  const c = calculatorContent[pathname];
  return c ? <CalculatorSeoContent c={c} /> : null;
}
