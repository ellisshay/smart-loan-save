import { useEffect, useRef, useState } from "react";
import type { FieldErrors, FieldValues, SubmitErrorHandler } from "react-hook-form";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";

function errorPaths(errors: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || typeof value !== "object" || key === "ref") return [];
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value || "type" in value) return [path];
    return errorPaths(value as Record<string, unknown>, path);
  });
}

/** Keep validation feedback local to the active step, including nested borrowers/tracks. */
export function useIntakeValidation<T extends FieldValues>(errors: FieldErrors<T>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
    for (const path of errorPaths(errors)) {
      form.querySelectorAll(`[name="${CSS.escape(path)}"], [data-validation-name="${CSS.escape(path)}"]`)
        .forEach((field) => field.setAttribute("aria-invalid", "true"));
    }
  }, [errors]);

  const onInvalid: SubmitErrorHandler<T> = (invalidErrors) => {
    const form = formRef.current;
    const names = errorPaths(invalidErrors).map((path) => {
      const field = form?.querySelector(`[name="${CSS.escape(path)}"], [data-validation-name="${CSS.escape(path)}"]`);
      return field?.parentElement?.querySelector("label")?.textContent?.replace(/\s*\*\s*$/, "").trim();
    }).filter((label): label is string => Boolean(label));
    setLabels([...new Set(names)]);
    setOpen(true);
  };

  const validationAlert = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent dir="rtl" className="max-w-[calc(100%-2rem)] sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const field = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
          field?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          field?.focus({ preventScroll: true });
        }}>
        <AlertDialogTitle className="text-destructive text-right">יש שדות שלא הושלמו או אינם תקינים</AlertDialogTitle>
        <AlertDialogDescription className="text-right">
          {labels.length ? `יש להשלים או לתקן: ${labels.join(", ")}. ` : "יש להשלים או לתקן את הפרטים בשלב הזה. "}
          השדות מסומנים באדום. הנתונים שהזנת נשארים בטופס.
        </AlertDialogDescription>
        <AlertDialogFooter><AlertDialogAction>חזרה לשדה החסר</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { formRef, onInvalid, validationAlert };
}