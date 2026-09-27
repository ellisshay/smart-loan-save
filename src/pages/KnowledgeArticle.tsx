import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, CalendarDays, User, ListChecks, Calculator, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clusters,
  knowledgeImages,
  getArticle,
  getCluster,
  getRelatedArticles,
} from "@/data/knowledge";
import type { Block, KnowledgeArticle } from "@/data/knowledge";

const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case "p":
      return <p className="text-[15px] md:text-base text-foreground/90 leading-[1.9] mb-5 text-right">{block.text}</p>;
    case "h2":
      return (
        <h2
          id={block.text.slice(0, 24)}
          className="font-display font-bold text-xl md:text-2xl text-foreground mt-10 mb-4 scroll-mt-28 text-right"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="font-display font-bold text-lg text-foreground mt-8 mb-3 text-right">{block.text}</h3>;
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px] text-foreground/90 leading-relaxed">
          <span className="text-primary mt-0.5 shrink-0">{block.ordered ? `${i + 1}.` : "•"}</span>
          <span>{item}</span>
        </li>
      ));
      return (
        <ul className={`space-y-2.5 mb-6 pe-1 ${block.ordered ? "" : ""}`} dir="rtl">
          {items}
        </ul>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto mb-6 rounded-xl border border-border">
          <table className="w-full text-sm text-right">
            {block.caption && <caption className="text-xs text-muted-foreground py-2">{block.caption}</caption>}
            <thead>
              <tr className="bg-secondary/70">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-display font-bold text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-border even:bg-muted/40">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-foreground/85 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "example":
      return (
        <aside className="rounded-2xl border border-primary/25 bg-primary/5 p-5 md:p-6 mb-6">
          <p className="font-display font-bold text-primary mb-2">{block.title}</p>
          <p className="text-[15px] text-foreground/85 leading-relaxed text-right">{block.text}</p>
        </aside>
      );
    case "note": {
      const warn = block.variant === "warn";
      return (
        <aside
          className={`rounded-2xl border p-5 md:p-6 mb-6 ${
            warn ? "border-warning/40 bg-warning/10" : "border-border bg-secondary/50"
          }`}
        >
          {block.title && (
            <p className={`font-display font-bold mb-2 ${warn ? "text-foreground" : "text-foreground"}`}>
              {block.title}
            </p>
          )}
          <p className="text-[15px] text-foreground/85 leading-relaxed text-right">{block.text}</p>
        </aside>
      );
    }
    default:
      return null;
  }
};

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
};

const KnowledgeArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticle(slug) : undefined;

  const headings = useMemo(
    () => (article ? article.blocks.filter((b): b is { type: "h2"; text: string } => b.type === "h2") : []),
    [article]
  );

  if (!article) return <Navigate to="/knowledge" replace />;

  const cluster = getCluster(article.clusterId);
  const related = getRelatedArticles(article as KnowledgeArticle);
  const image = article.imageKey ? knowledgeImages[article.imageKey] : undefined;
  const canonicalUrl = `https://smart-loan-save.lovable.app/knowledge/${article.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    inLanguage: "he",
    author: { "@type": "Organization", name: article.author },
    dateModified: article.updatedDate,
    mainEntityOfPage: canonicalUrl,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "משכנתאפדיה", item: "https://smart-loan-save.lovable.app/knowledge" },
      { "@type": "ListItem", position: 2, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{`${article.title} | משכנתאפדיה EASY MORTE`}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3">
        <Link to="/#assessment" className="block">
          <Button variant="cta" className="w-full">קבל ניתוח מלא חינם</Button>
        </Link>
      </div>

      <article className="pb-24 lg:pb-16">
        {/* Breadcrumb + header */}
        <header className="bg-[image:var(--hero-gradient)] border-b border-border py-10 md:py-14">
          <div className="container max-w-4xl mx-auto text-right">
            <nav aria-label="נתיב ניווט" className="flex items-center gap-1 text-xs text-muted-foreground mb-5 flex-wrap">
              <Link to="/" className="hover:text-foreground">ראשי</Link>
              <ChevronLeft size={12} />
              <Link to="/knowledge" className="hover:text-foreground">משכנתאפדיה</Link>
              <ChevronLeft size={12} />
              {cluster && <Link to={`/knowledge#${cluster.id}`} className="hover:text-foreground">{cluster.label}</Link>}
            </nav>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {cluster && <Badge variant="secondary">{cluster.label}</Badge>}
              {article.isPillar && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">מדריך מקיף</Badge>}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl text-foreground leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5"><User size={14} />{article.author}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} />{article.readTime} דק׳ קריאה</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                עודכן בתאריך {formatDate(article.updatedDate)}
              </span>
            </div>
          </div>
        </header>

        {/* Hero image */}
        {image && (
          <div className="container max-w-4xl mx-auto -mt-1">
            <img
              src={image.src}
              alt={article.imageAlt || article.title}
              width={image.width}
              height={image.height}
              loading="eager"
              className="w-full h-56 md:h-72 object-cover rounded-b-2xl md:rounded-b-3xl shadow-[var(--shadow-card)]"
            />
          </div>
        )}

        <div className="container max-w-4xl mx-auto px-4 py-10">
          {/* Direct answer */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/25 bg-primary/5 p-6 mb-10"
          >
            <p className="font-display font-bold text-primary mb-2">התשובה הקצרה</p>
            <p className="text-[15px] md:text-base text-foreground/90 leading-[1.9] text-right">
              {article.directAnswer}
            </p>
          </motion.section>

          <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
            {/* Body */}
            <div dir="rtl" className="min-w-0">
              {article.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}

              {/* Takeaways */}
              {article.takeaways && article.takeaways.length > 0 && (
                <section className="rounded-2xl bg-secondary/60 border border-border p-6 mb-10">
                  <p className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <ListChecks size={18} className="text-primary" />
                    הנקודות המרכזיות
                  </p>
                  <ul className="space-y-2.5" dir="rtl">
                    {article.takeaways.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px] text-foreground/90 leading-relaxed">
                        <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* FAQ */}
              <section className="mb-10" dir="rtl">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mt-10 mb-4">
                  שאלות שאנשים שואלים גם
                </h2>
                <Accordion type="single" collapsible className="text-right">
                  {article.faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="font-medium text-start text-[15px] text-foreground hover:text-primary hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[15px] text-muted-foreground leading-relaxed text-right">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              {/* CTA */}
              {article.calculator && (
                <section className="rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-6 md:p-8 mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    <Calculator size={22} />
                  </div>
                  <h2 className="font-display font-bold text-xl text-foreground mb-2">
                    רוצים לבדוק את זה על המספרים שלכם?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    הכלי החינמי שלנו יעשה את החישוב הזה על הנתונים האישיים שלכם.
                  </p>
                  <Link to={article.calculator.href}>
                    <Button variant="cta">{article.calculator.label}</Button>
                  </Link>
                </section>
              )}

              {/* Related */}
              {related.length > 0 && (
                <section className="mb-6">
                  <h2 className="font-display font-bold text-xl text-foreground mb-5">להרחבה מכאן</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
                    {related.map((r) => (
                      <Link
                        key={r.slug}
                        to={`/knowledge/${r.slug}`}
                        className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all text-right"
                      >
                        <p className="font-display font-bold text-[15px] text-foreground group-hover:text-primary transition-colors mb-1">
                          {r.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Desktop TOC */}
            {headings.length > 1 && (
              <aside className="hidden lg:block">
                <nav className="sticky top-28 rounded-2xl border border-border bg-card p-5" dir="rtl" aria-label="תוכן העניינים">
                  <p className="font-display font-bold text-sm text-foreground mb-3">תוכן העניינים</p>
                  <ul className="space-y-2">
                    {headings.map((h, i) => (
                      <li key={i}>
                        <a
                          href={`#${h.text.slice(0, 24)}`}
                          className="text-[13px] text-muted-foreground hover:text-primary transition-colors leading-snug block"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}
          </div>
        </div>
      </article>
    </>
  );
};

export default KnowledgeArticlePage;
