import { useState, useCallback } from "react";

import { gradesApi } from "../api";
import { App } from "antd";

export function useMyGrades() {
  const { message } = App.useApp();

  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGrades = useCallback(
    async (data: { periodId?: string } = {}) => {
      setLoading(true);

      const result = await gradesApi.listMy(data);

      if (result.status === "success") {
        setGrades(result.grades || []);
        setLoading(false);
      } else {
        message.error("Error al cargar las notas.");
        setLoading(false);
      }
    },
    [message],
  );

  return {
    grades,
    loading,
    fetchGrades,
  };
}
