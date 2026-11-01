import { DOC_STATE_LABEL, type DocRow, type DocState } from "@/lib/mortgage/model";
import { cn } from "@/lib/utils";

export const DOC_STATE_CLS: Record<DocState, string> = {
  missing: "bg-muted text-muted-foreground",
  received: "bg-primary/10 text-primary",
  review: "bg-warning/15 text-warning",
  ok: "bg-success/10 text-success",
  update: "bg-destructive/10 text-destructive",
};

export const DOC_STATE_HELP: Record<DocState, string> = {
  missing: "עוד לא הועלה",
  received: "הועלה ומחכה לבדיקה",
  review: "בבדיקה של איש מקצוע",
  ok: "נבדק ונמצא תקין",
  update: "צריך להעלות שוב",
};

export function DocStateChip({ state }: { state: DocState }) {
  return <span className={cn("text-[11px] font-medium rounded-full px-2 py-0.5 whitespace-nowrap", DOC_STATE_CLS[state])}>{DOC_STATE_LABEL[state]}</span>;
}

/** Top of the document center: what is required, what arrived, what is missing. */
export default function DocumentSummary({ rows }: { rows: DocRow[] }) {
  const required = rows.filter((r) => r.required);
  const uploaded = required.filter((r) => r.state !== "missing").length;
  const missing = required.filter((r) => r.state === "missing" && !r.deferred).length;
  const deferred = required.filter((r) => r.deferred).length;
  const update = rows.filter((r) => r.state === "update").length;
  const stats = [
    { label: "מסמכי חובה", value: required.length },
    { label: "הועלו", value: uploaded },
    { label: "חסרים", value: missing, warn: missing > 0 },
    { label: "נדרש עדכון", value: update, warn: update > 0 },
  ];
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="סיכום מסמכים">
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/40 py-3 px-1">
            <p className={cn("font-display text-2xl font-bold tabular-nums", s.warn ? "text-warning" : "text-foreground")}>{s.value}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {deferred > 0 && <p className="text-xs text-muted-foreground mt-3">{deferred} מסמכים סומנו לשליחה במועד מאוחר יותר. הטיפול המקצועי מתחיל כשכל מסמכי החובה התקבלו.</p>}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground" aria-label="מקרא סטטוסים">
        {(Object.keys(DOC_STATE_HELP) as DocState[]).map((s) => <li key={s} className="flex items-center gap-1.5"><DocStateChip state={s} /> {DOC_STATE_HELP[s]}</li>)}
      </ul>
    </section>
  );
}
