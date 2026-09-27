import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Search, Clock, Calculator, ChevronLeft, ShieldCheck, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clusters, knowledgeArticles, knowledgeImages, getArticlesByCluster } from "@/data/knowledge";
import type { KnowledgeArticle } from "@/data/knowledge";

const ArticleCard = ({ article }: { article: KnowledgeArticle }) => {
  const image = article.imageKey ? knowledgeImages[article.imageKey] : undefined;
  const cluster = clusters.find((c) => c.id === article.clusterId);
  return (
    <Link
      to={`/knowledge/${article.slug}`}
      className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-0.5"
    >
      {image && (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={image.src}
            alt={article.imageAlt || article.title}
            width={image.width}
            height={image.height}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 p-5 text-right">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {cluster && <Badge variant="secondary" className="text-[11px]">{cluster.label}</Badge>}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={12} />
            {article.readTime} דק׳ קריאה
          </span>
          {article.isPillar && (
            <Badge className="text-[11px] bg-primary/10 text-primary hover:bg-primary/10">מדריך מקיף</Badge>
          )}
        </div>
        <h3 className="font-display font-bold text-lg text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">{article.excerpt}</p>
        <span className="mt-auto text-sm font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          לקריאת המדריך
          <ChevronLeft size={15} />
        </span>
      </div>
    </Link>
  );
};

const KnowledgeHub = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return knowledgeArticles.filter(
      (a) =>
        a.title.includes(q) ||
        a.excerpt.includes(q) ||
        a.metaDescription.includes(q) ||
        a.directAnswer.includes(q)
    );
  }, [query]);

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "משכנתאפדיה — מרכז הידע של EasyMorte",
    description: "מדריכי משכנתאות מקיפים בעברית: תמהילים, מחזור, אישור עקרוני, מסמכים, עצמאים ויועצים.",
    inLanguage: "he",
  };

  return (
    <>
      <Helmet>
        <title>משכנתאפדיה — כל מה שצריך לדעת על משכנתא | EasyMorte</title>
        <meta
          name="description"
          content="מרכז הידע של EasyMorte: מדריכים מעמיקים על משכנתא ראשונה, מחזור, תמהילים, ריביות, אישור עקרוני, מסמכים, משכנתא לעצמאים ומכירות פומביות — בשפה שכל אחד מבין."
        />
        <meta property="og:title" content="משכנתאפדיה — כל מה שצריך לדעת על משכנתא | EasyMorte" />
        <meta
          property="og:description"
          content="מדריכים מעמיקים על משכנתא ראשונה, מחזור, תמהילים, ריביות, אישור עקרוני, מסמכים ועצמאים — בשפה שכל אחד מבין."
        />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(siteSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-[image:var(--hero-gradient)] py-16 md:py-20 border-b border-border">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <BookOpen size={16} />
            מרכז הידע של EasyMorte
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl text-foreground leading-tight mb-4">
            משכנתאפדיה
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            מדריכים מקצועיים, כנים ומעמיקים — בלי ז'רגון בנקאי ובלי הבטחות ריקניות. כל מה שכדאי לדעת
            לפני שחותמים על המשכנתא.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="מה תרצו ללמוד? למשל: מחזור, אישור עקרוני, תמהיל..."
              className="ps-11 h-12 rounded-xl bg-card text-start"
              aria-label="חיפוש מדריכים"
            />
          </div>
        </div>
      </section>

      {/* Search results */}
      {filtered && (
        <section className="container py-12">
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length > 0
              ? `נמצאו ${filtered.length} מדריכים ל״${query}״`
              : `לא נמצאו מדריכים ל״${query}״ — נסו מילה אחרת או עיינו באשכולות למטה`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Clusters */}
      {!filtered && (
        <div className="container py-12 md:py-16">
          {clusters.map((cluster) => {
            const articles = getArticlesByCluster(cluster.id);
            const calcs = cluster.calculators ?? [];
            return (
              <section key={cluster.id} className="mb-14 last:mb-0">
                <div className="mb-6 text-right">
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2">
                    {cluster.label}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{cluster.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                  {calcs.map((calc) => (
                    <Link
                      key={calc.href}
                      to={calc.href}
                      className="group flex flex-col justify-center items-start gap-3 rounded-2xl bg-secondary/60 border border-dashed border-primary/30 p-6 hover:bg-primary/5 transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
                        <Calculator size={20} />
                      </span>
                      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {calc.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{calc.desc}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Service commitment + CTA */}
          <section className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] p-8 md:p-12 text-center"
            >
              <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
                <ShieldCheck size={18} />
                תו השירות שלנו
              </div>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
                קראתם, למדתם — עכשיו בואו נבדוק מה המשכנתא שלכם צריכה
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                שאלון של דקות שנותן תמונת מצב אמיתית. מחיר קבוע של 3,450 שקל, טיפול בתיק עד 72 שעות
                מרגע שהתיק מושלם ושולם, ותשלום רק אחרי שהמסמכים הועלו ואומתו.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/#assessment">
                  <Button size="lg" variant="cta" className="w-full sm:w-auto">
                    קבל ניתוח מלא חינם
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    לתו השירות ולמחירים
                  </Button>
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      )}
    </>
  );
};

export default KnowledgeHub;
