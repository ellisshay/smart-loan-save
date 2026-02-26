import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, Lock } from "lucide-react";

interface Props {
  onNext: (data: { fullName: string; date: string }) => void;
  onBack: () => void;
}

export default function StepConsent({ onNext, onBack }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataUsageAccepted, setDataUsageAccepted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [date] = useState(new Date().toLocaleDateString("he-IL"));

  const allAccepted = termsAccepted && privacyAccepted && dataUsageAccepted && fullName.length >= 2;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">הצהרות ואישורים</h2>
        <p className="text-sm text-muted-foreground">אנא אשר את התנאים הבאים לפני הגשת התיק</p>
      </div>

      <div className="space-y-4">
        <ConsentItem
          icon={FileText}
          checked={termsAccepted}
          onCheckedChange={setTermsAccepted}
          title="תקנון ותנאי שימוש"
          description="אני מאשר/ת שקראתי והבנתי את תקנון ותנאי השימוש של EasyMorte."
          link="/legal/terms"
        />
        <ConsentItem
          icon={Lock}
          checked={privacyAccepted}
          onCheckedChange={setPrivacyAccepted}
          title="מדיניות פרטיות"
          description="אני מאשר/ת שקראתי את מדיניות הפרטיות ומסכים/ה לתנאיה."
          link="/legal/privacy"
        />
        <ConsentItem
          icon={Shield}
          checked={dataUsageAccepted}
          onCheckedChange={setDataUsageAccepted}
          title="שימוש בנתונים"
          description="אני מאשר/ת שימוש בנתוני לצורך הכנת תמהילים, הפקת דוח, והעברה לגורמי תפעול ולבנקים לפי צורך."
        />
      </div>

      {/* Digital signature */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-gold" />
          חתימה דיגיטלית
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">שם מלא *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="הקלד שם מלא"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">תאריך</Label>
            <Input value={date} disabled className="bg-muted" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button
          type="button"
          variant="cta"
          size="lg"
          disabled={!allAccepted}
          onClick={() => onNext({ fullName, date })}
        >
          שמור והמשך →
        </Button>
      </div>
    </motion.div>
  );
}

function ConsentItem({
  icon: Icon,
  checked,
  onCheckedChange,
  title,
  description,
  link,
}: {
  icon: React.ElementType;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
  link?: string;
}) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
      checked ? "bg-success/5 border-success/20" : "bg-card border-border"
    }`}>
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gold" />
          <span className="font-semibold text-sm text-foreground">{title}</span>
          {link && (
            <a href={link} target="_blank" rel="noopener" className="text-xs text-gold hover:underline">
              קרא עוד
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
