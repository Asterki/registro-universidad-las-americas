import { useState, useCallback } from "react";

import { enrollmentApi } from "../api";
import { App } from "antd";

export function useMyEnrollments() {
  const { message } = App.useApp();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEnrollments = useCallback(
    async (data: { periodId?: string } = {}) => {
      setLoading(true);

      const result = await enrollmentApi.listMy({
        periodId: data.periodId,
      });

      if (result.status === "success") {
        setEnrollments(result.enrollments || []);
        setLoading(false);
      } else {
        message.error("Error al cargar las matrículas.");
        setLoading(false);
      }
    },
    [message],
  );

  const cancelEnrollment = useCallback(
    async (enrollmentId: string) => {
      setLoading(true);

      const result = await enrollmentApi.cancelSelf({ enrollmentId });

      if (result.status === "success") {
        message.success("Matrícula cancelada exitosamente.");
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId ? { ...e, status: "cancelled" } : e,
          ),
        );
        setLoading(false);
        return true;
      } else {
        message.error("Error al cancelar la matrícula.");
        setLoading(false);
        return false;
      }
    },
    [message],
  );

  return {
    enrollments,
    loading,
    fetchEnrollments,
    cancelEnrollment,
  };
}
