import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuizData, calculateQuizScore } from "@/types/quiz";

const SESSION_KEY = "easymort_quiz_session";

export function useQuizSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Initialize or restore session
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSessionId(parsed.id);
          // Fetch latest from DB
          const { data } = await supabase
            .from("quiz_sessions")
            .select("quiz_data, current_step")
            .eq("id", parsed.id)
            .single();
          if (data) {
            setQuizData((data.quiz_data as unknown as QuizData) || {});
            setCurrentStep(data.current_step || 0);
            return;
          }
        } catch { /* fallthrough to create new */ }
      }
      // Create new session
      const { data } = await supabase
        .from("quiz_sessions")
        .insert({ quiz_data: {} })
        .select("id")
        .single();
      if (data) {
        setSessionId(data.id);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: data.id }));
      }
    };
    init();
  }, []);

  // Debounced save to DB
  const saveToDb = useCallback(
    (updatedData: QuizData, step: number) => {
      if (!sessionId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        const score = calculateQuizScore(updatedData);
        await supabase
          .from("quiz_sessions")
          .update({
            quiz_data: updatedData as any,
            current_step: step,
            score_estimate: score,
            purpose: updatedData.purpose || null,
          })
          .eq("id", sessionId);
        setSaving(false);
      }, 500);
    },
    [sessionId]
  );

  const updateData = useCallback(
    (partial: Partial<QuizData>) => {
      setQuizData((prev) => {
        const updated = { ...prev, ...partial };
        saveToDb(updated, currentStep);
        return updated;
      });
    },
    [saveToDb, currentStep]
  );

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step);
      saveToDb(quizData, step);
    },
    [saveToDb, quizData]
  );

  const markComplete = useCallback(async () => {
    if (!sessionId) return;
    const score = calculateQuizScore(quizData);
    await supabase
      .from("quiz_sessions")
      .update({ completed: true, score_estimate: score })
      .eq("id", sessionId);
    localStorage.setItem("easymort_score", String(score));
    localStorage.setItem("easymort_quiz", JSON.stringify(quizData));
    localStorage.setItem("easymort_reg_time", new Date().toISOString());
  }, [sessionId, quizData]);

  const score = calculateQuizScore(quizData);

  return {
    sessionId,
    quizData,
    currentStep,
    score,
    saving,
    updateData,
    goToStep,
    markComplete,
  };
}
