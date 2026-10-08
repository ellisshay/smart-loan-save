import {
  personalSchema, propertySchema, incomeSchema, liabilitiesSchema,
  mortgageRequestSchema, preferencesSchema, declarationsSchema,
  refiGoalSchema, currentMortgageSchema, refiPropertySchema, refiPreferencesSchema,
  NEW_CASE_STEPS, REFI_CASE_STEPS, type CaseType,
} from "@/types/intake";

const schemas = {
  personal: personalSchema, property: propertySchema, income: incomeSchema,
  liabilities: liabilitiesSchema, mortgage_request: mortgageRequestSchema,
  preferences: preferencesSchema, declarations: declarationsSchema,
  refi_goal: refiGoalSchema, current_mortgage: currentMortgageSchema,
  refi_property: refiPropertySchema, refi_preferences: refiPreferencesSchema,
};

/** Completion is derived from saved answers, never from the current navigation index. */
export function completedIntakeSteps(data: Record<string, any>, type: CaseType): string[] {
  const steps = type === "refi" ? REFI_CASE_STEPS : NEW_CASE_STEPS;
  return steps.filter(({ key }) => {
    const value = data[key];
    if (!value) return false;
    if (key === "equity") return Number(value.amount) > 0 && Array.isArray(value.sources) && value.sources.length > 0 && ["yes", "no"].includes(value.inAccount);
    if (key === "consent") return value.termsAccepted === true && value.privacyAccepted === true && value.dataUsageAccepted === true && typeof value.fullName === "string" && value.fullName.trim().length >= 2 && !!value.signature && !!value.signedAt;
    if (key === "documents") return value.completed === true;
    if (key === "summary") return false;
    const schema = schemas[key as keyof typeof schemas];
    return schema?.safeParse(value).success ?? false;
  }).map(({ key }) => key);
}