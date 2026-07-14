import { useState, useCallback } from "react";
import { App } from "antd";
import gradesApi from "../api";

export interface CourseGrade {
  id: string;
  enrollmentId: string;
  studentName: string;
  studentCode: string;
  type: string;
  score: number;
  description?: string;
  createdAt: string;
}

export function useCourseGrades() {
  const { message } = App.useApp();

  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGrades = useCallback(
    async (courseId: string) => {
      setLoading(true);
      const result = await gradesApi.listCourse({ courseId });
      if (result.status === "success") {
        const mapped = (result.grades ?? []).map((g: any) => ({
          id: g.id ?? g._id ?? "",
          enrollmentId: g.enrollmentId ?? "",
          studentName: g.enrollment?.student?.profile?.name ?? g.studentName ?? "",
          studentCode: g.enrollment?.student?.code ?? g.studentCode ?? "",
          type: g.type ?? "",
          score: g.score ?? 0,
          description: g.description ?? "",
          createdAt: g.createdAt ?? g.metadata?.createdAt ?? "",
        }));
        setGrades(mapped);
      } else {
        message.error("Error al cargar las notas");
      }
      setLoading(false);
    },
    [message],
  );

  return { grades, loading, fetchGrades };
}
