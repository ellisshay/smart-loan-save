import { toast } from "@/hooks/use-toast";

export function showCompletionToast(progress: number, stepName: string) {
  const remaining = Math.max(3, Math.ceil((100 - progress) / 12.5));
  
  toast({
    title: `✔ ${stepName} הושלם`,
    description: `אתה כבר ב-${progress}% · נשארו עוד כ-${remaining} דקות לסיום התיק`,
    duration: 4000,
  });
}
