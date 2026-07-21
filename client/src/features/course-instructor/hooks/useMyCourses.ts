import { useState, useCallback } from "react";
import { App } from "antd";
import courseInstructorApi from "../api";

export interface CourseAssignment {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  faculty: string;
  period: string;
  schedule: string;
  classroom: string;
  enrolledCount: number;
  status: string;
}

export function useMyCourses() {
  const { message } = App.useApp();

  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const result = await courseInstructorApi.listInstructor({
      accountId: "user",
    });
    if (result.status === "success") {
      const mapped = (result.courses ?? []).map((c: any) => ({
        id: c.id ?? c._id ?? "",
        courseId: c.courseId ?? "",
        courseName: c.name ?? c.courseName ?? "",
        courseCode: c.code ?? c.courseCode ?? "",
        faculty: c.faculty.name ?? c.faculty ?? "",
        period: c.period.name ?? c.period ?? "",
        schedule: c.schedule ?? c.course?.schedule ?? "",
        classroom: c.classroom ?? c.course?.classroom ?? "",
        enrolledCount: c.enrolledCount ?? c._count?.enrollments ?? 0,
        status: c.active ? "Activo" : "Inactivo",
      }));
      setCourses(mapped);
      setLoading(false);
    } else {
      message.error("Error al cargar los cursos.");
      setLoading(false);
    }
  }, [message]);

  return {
    courses,
    loading,
    fetchCourses,
  };
}
