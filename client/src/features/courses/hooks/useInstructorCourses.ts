import { useState, useCallback } from "react";
import { App } from "antd";
import coursesApi from "../api";

export interface InstructorCourse {
  id: string;
  name: string;
  code: string;
  faculty: string;
  period: string;
  schedule: string;
  classroom: string;
  enrolledCount: number;
}

export function useInstructorCourses() {
  const { message } = App.useApp();

  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(
    async (period?: string) => {
      setLoading(true);
      const result = await coursesApi.listByPeriod({ periodId: period || "" });
      if (result.status === "success") {
        const mapped = (result.courses ?? []).map((c: any) => ({
          id: c.id ?? c._id ?? "",
          name: c.name ?? "",
          code: c.code ?? "",
          faculty: c.faculty ?? "",
          period: c.period ?? "",
          schedule: c.schedule ?? "",
          classroom: c.classroom ?? "",
          enrolledCount: c.enrolledCount ?? 0,
        }));
        setCourses(mapped);
      } else {
        message.error("Error al cargar los cursos");
      }
      setLoading(false);
    },
    [message],
  );

  return { courses, loading, fetchCourses };
}
