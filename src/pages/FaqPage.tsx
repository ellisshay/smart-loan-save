import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { generalFaqs } from "@/seo/landingContent";
import { FaqList, RelatedLinks } from "@/components/seo/SeoBlocks";

export default function FaqPage() {
  return (
    <div dir="rtl" className="container max-w-4xl py-12 space-y-10 text-right">
      <header>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground mb-4">שאלות נפוצות</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          ריכזנו את השאלות שאנחנו נשאלים הכי הרבה על השירות, המחיר, המסמכים ותהליך המשכנתא.
        </p>
      </header>
      <FaqList faqs={generalFaqs} title="השירות והתהליך" />
      <RelatedLinks
        links={[
          { label: "איך זה עובד", href: "/how-it-works" },
          { label: "מחירים", href: "/pricing" },
          { label: "מחזור משכנתא", href: "/mortgage-refinance" },
          { label: "משכנתא ראשונה", href: "/first-mortgage" },
          { label: "צור קשר", href: "/contact" },
        ]}
      />
      <div className="text-center">
        <Link to="/intake"><Button variant="cta" size="lg">הגש בקשה עכשיו</Button></Link>
      </div>
    </div>
  );
}
