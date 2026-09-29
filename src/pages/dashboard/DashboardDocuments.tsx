import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertTriangle, FileText, User, DollarSign, Home, Loader2, XCircle, ScanLine, ShieldCheck, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { LEVEL_UI, levelOf, isDocSettled } from "@/lib/docValidation";

interface UploadedDoc {
  id: string;
  doc_type: string;
  file_name: string;
  is_required: boolean;
  file_path: string;
  ai_extracted_data: any;
}

const DOC_CATEGORIES = [
  {
    key: "identity",
    label: "זיהוי",
    icon: User,
    docTypes: ["id_card", "id_card_b2"],
  },
  {
    key: "income",
    label: "הכנסות",
    icon: DollarSign,
    docTypes: ["payslips", "bank_statements", "annual_reports", "bookkeeping"],
  },
  {
    key: "mortgage",
    label: "משכנתא",
    icon: Home,
    docTypes: ["purchase_contract", "mortgage_report", "settlement_report", "appraisal", "land_registry", "rights_approval", "existing_offer", "other_loans", "loan_balances"],
  },
];

export default function DashboardDocuments() {
  const { caseId, caseType, intakeData, loading: caseLoading, saveStep } = useDashboardCase();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [generalLabel, setGeneralLabel] = useState("");

  const deferredDocs: string[] = intakeData.deferred_docs ?? [];
  const toggleDeferred = (docType: string) => {
    const next = deferredDocs.includes(docType)
      ? deferredDocs.filter((t) => t !== docType)
      : [...deferredDocs, docType];
    saveStep("deferred_docs", next);
    toast({
      title: deferredDocs.includes(docType) ? "הסימון הוסר" : "סומן — תשלח במועד אחר",
      description: deferredDocs.includes(docType) ? undefined : "תוכל להשלים את המסמך בכל עת מהאזור האישי",
    });
  };

  const verifyDoc = async (documentId: string) => {
    setVerifying(documentId);
    const { data, error } = await supabase.functions.invoke("analyze-document", { body: { document_id: documentId } });
    setVerifying(null);
    if (error || data?.error) toast({ title: "האימות לא הושלם", description: data?.error || "נסה שוב בעוד רגע", variant: "destructive" });
    else {
      const l = levelOf(data.result);
      toast({
        title: l === "green" ? "המסמך אומת בהצלחה" : l === "yellow" ? "המסמך התקבל ועובר בדיקת מומחה" : "נדרשת סריקה חוזרת",
        description: data.result?.summary,
        variant: l === "red" ? "destructive" : undefined,
      });
    }
    loadDocs();
  };

  const replaceDoc = async (doc: UploadedDoc) => {
    await supabase.storage.from("case-documents").remove([doc.file_path]);
    await supabase.from("case_documents").delete().eq("id", doc.id);
    loadDocs();
  };

  const hasBorrower2 = intakeData.personal?.borrowerCount === "2";

  useEffect(() => {
    if (!caseId) return;
    loadDocs();
  }, [caseId]);

  const loadDocs = async () => {
    if (!caseId) return;
    const { data } = await supabase.from("case_documents").select("id, doc_type, file_name, is_required, file_path, ai_extracted_data").eq("case_id", caseId);
    if (data) setUploadedDocs(data as UploadedDoc[]);
    setLoading(false);
  };

  const requiredDocs = caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW;
  const uploadedTypes = uploadedDocs.map(d => d.doc_type);

  const handleUpload = async (docType: string, label: string, file: File) => {
    if (!caseId) return;
    setUploading(docType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("נדרשת התחברות מחדש");
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const filePath = `${user.id}/${caseId}/${docType}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("case-documents").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const isRequired = requiredDocs.find(d => d.type === docType)?.required ?? false;
      const { data: inserted, error: insErr } = await supabase.from("case_documents").insert({
        case_id: caseId,
        doc_type: docType,
        file_name: file.name,
        file_path: filePath,
        is_required: isRequired,
      }).select("id").single();
      if (insErr) throw insErr;

      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "doc_uploaded", case_id: caseId, payload: { doc_type: docType } },
      });

      toast({ title: `${label} הועלה, מתחיל סריקה ואימות` });
      await loadDocs();
      if (inserted) verifyDoc(inserted.id);
    } catch (e: any) {
      console.error("Upload error:", e);
      toast({ title: "שגיאה בהעלאה", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleGeneralUpload = async (file: File) => {
    if (!caseId) return;
    setUploading("general");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("נדרשת התחברות מחדש");
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const filePath = `${user.id}/${caseId}/general/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("case-documents").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error: insErr } = await supabase.from("case_documents").insert({
        case_id: caseId,
        doc_type: "general",
        file_name: generalLabel.trim() ? `${generalLabel.trim()} — ${file.name}` : file.name,
        file_path: filePath,
        is_required: false,
      });
      if (insErr) throw insErr;
      setGeneralLabel("");
      toast({ title: "המסמך נוסף לתיק" });
      await loadDocs();
    } catch (e: any) {
      toast({ title: "שגיאה בהעלאה", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const removeGeneral = async (doc: UploadedDoc) => {
    await supabase.storage.from("case-documents").remove([doc.file_path]);
    await supabase.from("case_documents").delete().eq("id", doc.id);
    loadDocs();
  };


  if (caseLoading || loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Build documents per category with progressive reveal
  const getCategoryDocs = (category: typeof DOC_CATEGORIES[0]) => {
    const allDocs = requiredDocs.filter(d => category.docTypes.includes(d.type));
    // Add borrower 2 ID if applicable
    if (category.key === "identity" && hasBorrower2) {
      allDocs.push({ type: "id_card_b2", label: "ת\"ז לווה 2 + ספח", required: true });
    }

    // Progressive reveal: show required first, then after first required is uploaded, show optional
    const required = allDocs.filter(d => d.required);
    const optional = allDocs.filter(d => !d.required);
    const allRequiredUploaded = required.every(d => uploadedTypes.includes(d.type));

    return { required, optional, allRequiredUploaded };
  };

  const totalRequired = requiredDocs.filter(d => d.required).length;
  const uploadedRequired = requiredDocs.filter(d => d.required && uploadedTypes.includes(d.type)).length;
  const verifiedRequired = requiredDocs.filter(d => d.required && uploadedDocs.some(u => u.doc_type === d.type && isDocSettled(u.ai_extracted_data))).length;
  const deferredRequired = requiredDocs.filter(d => d.required && !uploadedTypes.includes(d.type) && deferredDocs.includes(d.type)).length;
  const settledRequired = verifiedRequired + deferredRequired;
  const pct = totalRequired ? Math.round((settledRequired / totalRequired) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">העלאת מסמכים</h2>
        <p className="text-sm text-muted-foreground">העלה את המסמכים הנדרשים · {uploadedRequired}/{totalRequired} חובה הועלו</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> השלמת תיק מסמכים</span>
            <span className="font-mono text-primary font-bold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <p className="text-xs text-muted-foreground">{settledRequired} מתוך {totalRequired} מסמכי חובה טופלו · כל מסמך נבדק לאיכות סריקה, אמינות והתאמה סבירה לנתונים שמסרת. פערים קטנים בשם, במעסיק או בשכר הם נורמליים ועוברים בדיקה של מומחה, בלי לעכב אותך. מסמך שאין לך כרגע? סמן "אשלח במועד אחר" והמשך לתשלום.</p>
        </CardContent>
      </Card>

      {/* Progress badge */}
      <div className="flex items-center gap-3">
        <Badge className={`text-xs ${settledRequired === totalRequired ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"}`}>
          {settledRequired === totalRequired ? "כל מסמכי החובה טופלו — אפשר להמשיך לתשלום" : `חסרים ${totalRequired - settledRequired} מסמכי חובה`}
        </Badge>
      </div>

      {/* Categories */}
      {DOC_CATEGORIES.map((cat) => {
        const { required, optional, allRequiredUploaded } = getCategoryDocs(cat);
        const Icon = cat.icon;
        if (required.length === 0 && optional.length === 0) return null;

        return (
          <motion.div key={cat.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
                  <Icon size={18} className="text-primary" />
                  {cat.label}
                </h3>

                <div className="space-y-3">
                  {required.map((doc) => (
                    <DocRow
                      key={doc.type}
                      doc={doc}
                      uploaded={uploadedDocs.find(u => u.doc_type === doc.type)}
                      uploading={uploading === doc.type}
                      verifying={verifying}
                      deferred={deferredDocs.includes(doc.type)}
                      onToggleDeferred={toggleDeferred}
                      onVerify={verifyDoc}
                      onReplace={replaceDoc}
                      onUpload={(file) => handleUpload(doc.type, doc.label, file)}
                    />
                  ))}

                  {/* Progressive reveal for optional */}
                  <AnimatePresence>
                    {allRequiredUploaded && optional.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground">מסמכים נוספים (אופציונלי):</p>
                        {optional.map((doc) => (
                          <DocRow
                            key={doc.type}
                            doc={doc}
                            uploaded={uploadedDocs.find(u => u.doc_type === doc.type)}
                            uploading={uploading === doc.type}
                            verifying={verifying}
                            deferred={deferredDocs.includes(doc.type)}
                            onToggleDeferred={toggleDeferred}
                            onVerify={verifyDoc}
                            onReplace={replaceDoc}
                            onUpload={(file) => handleUpload(doc.type, doc.label, file)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* General / additional documents */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            מסמכים כלליים נוספים
          </h3>
          <p className="text-xs text-muted-foreground">
            אפשר לצרף כל מסמך נוסף שרלוונטי לתיק — הסכם ממון, שמאות, מכתב הסבר, תדפיס נוסף ועוד. המסמכים נשמרים בתיק ונגישים לצוות המקצועי.
          </p>
          {uploadedDocs.filter(d => d.doc_type === "general").map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <FileText size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate">{d.file_name}</span>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => removeGeneral(d)}>הסר</Button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="text"
              value={generalLabel}
              onChange={(e) => setGeneralLabel(e.target.value)}
              placeholder="תיאור המסמך (לא חובה)"
              className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGeneralUpload(f); e.target.value = ""; }} />
              <Button variant="outline" size="sm" className="text-xs pointer-events-none w-full sm:w-auto" disabled={uploading === "general"}>
                {uploading === "general" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading === "general" ? "מעלה..." : "העלאת מסמך נוסף"}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>← חזרה לדשבורד</Button>
        {settledRequired === totalRequired && (
          <Button variant="cta" size="lg" onClick={() => window.location.href = "/dashboard"}>
            סיים וחזור לדשבורד </Button>
        )}
      </div>
    </div>
  );
}

const LEVEL_ICON = { green: CheckCircle2, yellow: AlertTriangle, red: XCircle } as const;

function DocRow({ doc, uploaded, uploading, verifying, deferred, onToggleDeferred, onUpload, onVerify, onReplace }: {
  doc: { type: string; label: string; required: boolean };
  uploaded?: UploadedDoc;
  uploading: boolean;
  verifying: string | null;
  deferred: boolean;
  onToggleDeferred: (docType: string) => void;
  onUpload: (file: File) => void;
  onVerify: (id: string) => void;
  onReplace: (doc: UploadedDoc) => void;
}) {
  const v = uploaded?.ai_extracted_data;
  const isScanning = !!uploaded && verifying === uploaded.id;
  const lvl = levelOf(v);
  const st = lvl ? LEVEL_UI[lvl] : undefined;
  const Icon = isScanning ? ScanLine : lvl ? LEVEL_ICON[lvl] : uploaded ? Loader2 : FileText;
  const issues: string[] = [...(v?.quality?.issues ?? []), ...(v?.authenticity?.flags ?? [])];
  const notes = (v?.cross_check ?? []).filter((c: any) => c.level === "yellow" || c.level === "red" || c.status === "mismatch");

  return (
    <div className={`p-3 rounded-lg border transition-all ${st?.row ?? (uploaded ? "bg-primary/5 border-primary/20" : deferred ? "bg-muted/40 border-border" : "bg-muted/20 border-border")}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-card border border-border">
          <Icon size={16} className={isScanning ? "text-primary animate-pulse" : st ? "" : uploaded ? "text-muted-foreground animate-spin" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground block">{doc.label}</span>
          {uploaded && <span className="text-[11px] text-muted-foreground truncate block">{uploaded.file_name}</span>}
          {!uploaded && doc.required && !deferred && <span className="text-[10px] text-destructive">חובה</span>}
          {!uploaded && deferred && <span className="text-[10px] text-primary font-medium">ישלח במועד אחר</span>}
        </div>
        {uploaded ? (
          <div className="flex items-center gap-2">
            {isScanning ? <Badge variant="outline" className="text-[10px]">בסריקה...</Badge>
              : st ? <Badge className={`${st.cls} text-[10px]`}>{st.clientLabel}</Badge>
              : <Button size="sm" variant="outline" className="text-xs" onClick={() => onVerify(uploaded.id)}>אמת מסמך</Button>}
            {lvl === "red" && !isScanning && (
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => onReplace(uploaded)}><RefreshCw size={13} /> החלף</Button>
            )}
          </div>
        ) : (
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
            <Button variant="outline" size="sm" className="text-xs pointer-events-none" disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "מעלה..." : "העלה"}
            </Button>
          </label>
        )}
      </div>
      {!uploaded && doc.required && (
        <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={deferred}
            onChange={() => onToggleDeferred(doc.type)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">אשלח במועד אחר — אפשר להמשיך לתשלום ולהשלים מאוחר יותר</span>
        </label>
      )}
      {v && !isScanning && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-2 text-xs">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <span>איכות סריקה: <b className="text-foreground">{v.quality?.score ?? "-"}/100</b></span>
            <span>אמינות: <b className="text-foreground">{v.authenticity?.status === "authentic" ? "תקין" : v.authenticity?.status === "suspicious" ? "חשד לעריכה" : "לא חד משמעי"}</b></span>
          </div>
          {v.summary && <p className="text-foreground">{v.summary}</p>}
          {lvl === "yellow" && <p className="text-warning">המסמך התקבל ונשמר בתיק. מומחה המשכנתאות שלנו יעבור על הפרטים, לא נדרשת ממך פעולה כרגע.</p>}
          {notes.map((m: any, i: number) => (
            <p key={i} className={m.level === "red" ? "text-destructive" : "text-warning"}>
              {m.field}: נמסר {m.declared ?? "-"}, במסמך זוהה {m.extracted ?? m.found ?? "-"}
              {m.reason ? ` · ${m.reason}` : ""}
            </p>
          ))}
          {issues.slice(0, 3).map((t, i) => <p key={i} className="text-muted-foreground">• {t}</p>)}
          {v.detected_loans?.length > 0 && (
            <p className="text-muted-foreground">זוהו החזרים קבועים: {v.detected_loans.map((l: any) => `${l.description} (${l.monthly_amount?.toLocaleString()} ₪)`).join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
