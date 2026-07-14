import { useState, useCallback } from "react";
import { App } from "antd";
import gradesApi from "../api";

export function useRecordGrade() {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const recordGrade = useCallback(
    async (data: { enrollmentId: string; score: number; description?: string }) => {
      setSubmitting(true);
      const result = await gradesApi.record({
        enrollmentId: data.enrollmentId,
        score: data.score,
        description: data.description || "Evaluación",
      });
      if (result.status === "success") {
        message.success("Nota registrada exitosamente");
        return true;
      } else {
        message.error("Error al registrar la nota");
        return false;
      }
    },
    [message],
  );

  const bulkRecord = useCallback(
    async (grades: { enrollmentId: string; score: number; description?: string }[]) => {
      setSubmitting(true);
      const result = await gradesApi.bulkRecord({
        grades: grades.map((g) => ({
          enrollmentId: g.enrollmentId,
          score: g.score,
          description: g.description || "Evaluación",
        })),
      });
      if (result.status === "success") {
        message.success("Notas registradas exitosamente");
        return true;
      } else {
        message.error("Error al registrar las notas");
        return false;
      }
    },
    [message],
  );

  return { recordGrade, bulkRecord, submitting };
}
