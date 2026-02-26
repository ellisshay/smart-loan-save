import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertTriangle, FileText, User, DollarSign, Home, Loader2, X, Eye } from "lucide-react";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";

interface UploadedDoc {
  id: string;
  doc_type: string;
  file_name: string;
  is_required: boolean;
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
  const { caseId, caseType, intakeData, loading: caseLoading } = useDashboardCase();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasBorrower2 = intakeData.personal?.borrowerCount === "2";

  useEffect(() => {
    if (!caseId) return;
    loadDocs();
  }, [caseId]);

  const loadDocs = async () => {
    if (!caseId) return;
    const { data } = await supabase.from("case_documents").select("id, doc_type, file_name, is_required").eq("case_id", caseId);
    if (data) setUploadedDocs(data);
    setLoading(false);
  };

  const requiredDocs = caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW;
  const uploadedTypes = uploadedDocs.map(d => d.doc_type);

  const handleUpload = async (docType: string, label: string, file: File) => {
    if (!caseId) return;
    setUploading(docType);
    try {
      const filePath = `${caseId}/${docType}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from("case-documents").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const isRequired = requiredDocs.find(d => d.type === docType)?.required ?? false;
      await supabase.from("case_documents").insert({
        case_id: caseId,
        doc_type: docType,
        file_name: file.name,
        file_path: filePath,
        is_required: isRequired,
      });

      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "doc_uploaded", case_id: caseId, payload: { doc_type: docType } },
      });

      toast({ title: `✔ ${label} הועלה בהצלחה` });
      loadDocs();
    } catch (e: any) {
      console.error("Upload error:", e);
      toast({ title: "שגיאה בהעלאה", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">העלאת מסמכים</h2>
        <p className="text-sm text-muted-foreground">העלה את המסמכים הנדרשים · {uploadedRequired}/{totalRequired} חובה הועלו</p>
      </div>

      {/* Progress badge */}
      <div className="flex items-center gap-3">
        <Badge className={`text-xs ${uploadedRequired === totalRequired ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning border-warning/20"}`}>
          {uploadedRequired === totalRequired ? "✔ כל מסמכי החובה הועלו" : `חסרים ${totalRequired - uploadedRequired} מסמכי חובה`}
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

      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>← חזרה לדשבורד</Button>
        {uploadedRequired === totalRequired && (
          <Button variant="cta" size="lg" onClick={() => window.location.href = "/dashboard"}>
            סיים וחזור לדשבורד ✓
          </Button>
        )}
      </div>
    </div>
  );
}

function DocRow({ doc, uploaded, uploading, onUpload }: {
  doc: { type: string; label: string; required: boolean };
  uploaded?: UploadedDoc;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      uploaded ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        uploaded ? "bg-primary/10" : "bg-muted"
      }`}>
        {uploaded ? <CheckCircle2 size={16} className="text-primary" /> : <FileText size={16} className="text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground block">{doc.label}</span>
        {uploaded && <span className="text-[11px] text-muted-foreground truncate block">{uploaded.file_name}</span>}
        {!uploaded && doc.required && <span className="text-[10px] text-destructive">חובה</span>}
      </div>
      {uploaded ? (
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">✔ הועלה</Badge>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          <Button variant="outline" size="sm" className="text-xs pointer-events-none" disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "מעלה..." : "העלה"}
          </Button>
        </label>
      )}
    </div>
  );
}
