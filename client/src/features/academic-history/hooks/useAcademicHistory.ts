import { useState, useCallback } from "react";

import { academicHistoryApi } from "../api";
import { App } from "antd";

export function useAcademicHistory() {
  const { message } = App.useApp();

  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    totalCredits?: number;
    gpa?: number;
    completedCourses?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(
    async (data: { periodId?: string } = {}) => {
      setLoading(true);

      const result = await academicHistoryApi.getMy({});

      if (result.status === "success") {
        setHistory(result.history || []);
        setSummary(result.summary || null);
        setLoading(false);
      } else {
        message.error("Error al cargar el historial académico.");
        setLoading(false);
      }
    },
    [message],
  );

  return {
    history,
    summary,
    loading,
    fetchHistory,
  };
}
