import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Clock, BookOpen, CheckCircle2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { articlesData } from "@/data/articlesData";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = articlesData.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="font-display text-2xl font-bold text-foreground">המאמר לא נמצא</h1>
        <Link to="/blog">
          <Button variant="outline">חזרה למשכנתאפדיה</Button>
        </Link>
      </div>
    );
  }

  const related = articlesData.filter((a) => article.relatedSlugs.includes(a.slug));
  const publishDate = new Date(article.publishDate).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <Helmet>
        <title>{article.title} | משכנתאפדיה – EasyMorte</title>
        <meta name="description" content={article.metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://smart-loan-save.lovable.app/blog/${article.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.metaDescription,
            datePublished: article.publishDate,
            author: { "@type": "Organization", name: "EasyMorte" },
            publisher: { "@type": "Organization", name: "EasyMorte" },
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight size={14} /> חזרה למשכנתאפדיה
            </Link>

            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              {article.category}
            </span>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={14} /> {article.readTime} קריאה
              </span>
              <span>{publishDate}</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-foreground transition-colors mr-auto"
              >
                <Share2 size={14} /> שיתוף
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <article className="py-12 md:py-20 bg-background">
        <div className="container max-w-3xl">
          {/* Intro */}
          <motion.p
            className="text-lg text-muted-foreground leading-relaxed mb-10 pb-10 border-b border-border"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            {article.excerpt}
          </motion.p>

          {/* Sections */}
          <div className="space-y-10">
            {article.sections.map((section, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{i + 1}</span>
                  </span>
                  {section.heading}
                </h2>
                <div className="text-foreground/80 leading-relaxed text-[15px] pr-11 whitespace-pre-line">
                  {section.content}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Key Takeaways */}
          <motion.div
            className="mt-14 bg-primary/5 border border-primary/15 rounded-2xl p-6 md:p-8"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" /> נקודות מפתח
            </h3>
            <ul className="space-y-3">
              {article.keyTakeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-14 bg-primary rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-xl font-bold text-primary-foreground mb-2">
              רוצה לבדוק כמה אתה באמת משלם?
            </h3>
            <p className="text-primary-foreground/70 text-sm mb-5">
              השתמש במחשבונים החינמיים שלנו לחישוב מדויק
            </p>
            <Link to="/calculators">
              <Button variant="cta" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                למחשבונים →
              </Button>
            </Link>
          </motion.div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="mt-14">
              <h3 className="font-display text-lg font-bold text-foreground mb-6">
                מאמרים קשורים
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="flex items-start gap-4 bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug mb-1">
                        {r.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">{r.readTime} קריאה</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
