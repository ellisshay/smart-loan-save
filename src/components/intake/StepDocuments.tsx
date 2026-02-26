import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, XCircle, FileText, Clock } from "lucide-react";

interface DocDef {
  type: string;
  label: string;
  required: boolean;
}

interface UploadedDoc {
  type: string;
  fileName: string;
  filePath: string;
}

interface Props {
  docs: DocDef[];
  caseId: string | null;
  uploadedDocs: UploadedDoc[];
  onUploaded: (doc: UploadedDoc) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDocuments({ docs, caseId, uploadedDocs, onUploaded, onNext, onBack }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = useCallback(async (docType: string, file: File) => {
    if (!caseId) return;
    setUploading(docType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${caseId}/${docType}_${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase.from("case_documents").insert({
        case_id: caseId,
        doc_type: docType,
        file_name: file.name,
        file_path: filePath,
        is_required: docs.find(d => d.type === docType)?.required ?? true,
      });

      if (dbError) throw dbError;

      onUploaded({ type: docType, fileName: file.name, filePath });
      
      // Fire webhook
      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "docs_uploaded", case_id: caseId, payload: { doc_type: docType, file_name: file.name } },
      });

      toast({ title: `${file.name} הועלה בהצלחה ✅` });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "שגיאה בהעלאה", description: error.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }, [caseId, docs, onUploaded]);

  const isUploaded = (docType: string) => uploadedDocs.some(d => d.type === docType);
  const requiredUploaded = docs.filter(d => d.required).every(d => isUploaded(d.type));

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">העלאת מסמכים</h2>
        <p className="text-sm text-muted-foreground">
          ניתן להעלות עכשיו או מאוחר יותר. מסמכי חובה מסומנים ב-*
        </p>
      </div>

      <div className="space-y-3">
        {docs.map((doc) => {
          const uploaded = isUploaded(doc.type);
          const isCurrentUploading = uploading === doc.type;

          return (
            <div
              key={doc.type}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                uploaded
                  ? "bg-success/5 border-success/20"
                  : "bg-card border-border hover:border-gold/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {uploaded ? (
                  <CheckCircle2 size={20} className="text-success" />
                ) : (
                  <FileText size={20} className="text-muted-foreground" />
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {doc.label} {doc.required && <span className="text-destructive">*</span>}
                  </span>
                  {uploaded && (
                    <p className="text-xs text-success">
                      {uploadedDocs.find(d => d.type === doc.type)?.fileName}
                    </p>
                  )}
                </div>
              </div>

              {uploaded ? (
                <span className="text-xs text-success font-semibold">הועלה ✓</span>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(doc.type, file);
                    }}
                    disabled={isCurrentUploading}
                  />
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isCurrentUploading
                      ? "bg-muted text-muted-foreground"
                      : "bg-gold/10 text-gold hover:bg-gold/20"
                  }`}>
                    {isCurrentUploading ? (
                      <><Clock size={14} className="animate-spin" /> מעלה...</>
                    ) : (
                      <><Upload size={14} /> העלאה</>
                    )}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {!requiredUploaded && (
        <div className="flex items-start gap-3 bg-warning/10 text-warning rounded-lg p-4 text-sm">
          <XCircle size={18} className="shrink-0 mt-0.5" />
          <span>חלק ממסמכי החובה טרם הועלו. ניתן להמשיך ולהעלות מאוחר יותר, אבל התיק לא ייחשב "מלא" עד להשלמה.</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="button" variant="cta" size="lg" onClick={onNext}>
          {requiredUploaded ? "שמור והמשך →" : "אעלה מאוחר יותר, המשך →"}
        </Button>
      </div>
    </motion.div>
  );
}
