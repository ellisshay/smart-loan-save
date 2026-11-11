import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin list of contact-form messages (table contact_messages, admin-only by RLS).
 * Every message is saved before the email to info@ is attempted, so this list is where a message is
 * still visible when that email failed. "סמן כטופל" records handled_at.
 */
export type ContactRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  email_status: "pending" | "sent" | "failed";
  handled_at: string | null;
};

// contact_messages is added by migration 0009 and is not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase.from as unknown as (t: string) => any)("contact_messages");

export default function ContactMessages() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await table()
      .select("id,created_at,name,phone,email,message,email_status,handled_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setError(!!error);
    setRows((data as ContactRow[]) || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markHandled = async (id: string, handled: boolean) => {
    await table().update({ handled_at: handled ? new Date().toISOString() : null }).eq("id", id);
    void load();
  };

  const open = rows.filter((r) => !r.handled_at).length;
  return (
    <section className="mt-8 space-y-4" aria-labelledby="contact-messages-title">
      <h2 id="contact-messages-title" className="font-display text-xl font-bold text-foreground">
        פניות מטופס צור קשר{" "}
        {rows.length > 0 && <span className="text-sm font-normal text-muted-foreground">· {open} פתוחות</span>}
      </h2>
      {error ? (
        <p role="alert" className="text-destructive">לא הצלחנו לטעון את הפניות</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">אין פניות עדיין</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              data-contact-id={r.id}
              className={`rounded-xl border p-4 ${r.handled_at ? "border-border opacity-70" : "border-primary/40"}`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold text-foreground">{r.name}</span>
                <a href={`tel:${r.phone}`} dir="ltr" className="text-primary underline">{r.phone}</a>
                <a href={`mailto:${r.email}`} dir="ltr" className="text-primary underline">{r.email}</a>
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("he-IL")}</span>
                {r.email_status !== "sent" && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                    {r.email_status === "failed" ? "המייל ל-info@ נכשל" : "המייל ל-info@ טרם נשלח"}
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
              <button
                type="button"
                onClick={() => void markHandled(r.id, !r.handled_at)}
                className="mt-2 text-sm text-primary underline"
              >
                {r.handled_at ? "החזר לפתוחות" : "סמן כטופל"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
