import { useState, useCallback } from "react";

import { coursesApi } from "../api";
import { App } from "antd";

export function useAvailableCourses() {
  const { message } = App.useApp();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(
    async (data: { periodId?: string; facultyId?: string } = {}) => {
      setLoading(true);

      if (!data.periodId) {
        message.warning("Selecciona un período primero.");
        setLoading(false);
        return;
      }

      const result = await coursesApi.listAvailable({
        periodId: data.periodId,
      });

      if (result.status === "success") {
        setCourses(result.courses || []);
        setLoading(false);
      } else {
        message.error("Error al cargar los cursos disponibles.");
        setLoading(false);
      }
    },
    [message],
  );

  return {
    courses,
    loading,
    fetchCourses,
  };
}
