import { useState, useCallback } from "react";
import { App } from "antd";
import coursesApi from "../api";

export interface RosterStudent {
  id: string;
  student: {
    code?: string;
    profile?: { name?: string; lastName?: string };
    email?: { value?: string };
  };
  status: string;
}

export function useCourseRoster() {
  const { message } = App.useApp();

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoster = useCallback(
    async (courseId: string) => {
      setLoading(true);
      const result = await coursesApi.getRoster({ courseId });
      if (result.status === "success") {
        const mapped = (result.students ?? []).map((s: any) => ({
          id: s.id ?? s._id ?? s.studentId ?? "",
          student: s.student ?? {},
          status: s.status ?? "active",
        }));
        setStudents(mapped);
      } else {
        message.error("Error al cargar la lista de estudiantes");
      }
      setLoading(false);
    },
    [message],
  );

  return { students, loading, fetchRoster };
}
