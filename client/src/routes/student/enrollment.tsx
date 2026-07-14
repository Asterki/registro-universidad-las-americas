import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import EnrollmentFeature from "../../features/enrollment";
import CoursesFeature from "../../features/courses";
import { FaClipboardList } from "react-icons/fa";

export const Route = createFileRoute("/student/enrollment")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message } = App.useApp();

  const { loading, enroll } = EnrollmentFeature.hooks.useEnrollSelf();
  const { courses, loading: coursesLoading, fetchCourses } =
    CoursesFeature.hooks.useAvailableCourses();

  const [periods] = useState<{ id: string; name: string }[]>([
    // Periods will come from a period API in production
  ]);

  useEffect(() => {
    if (account) {
      fetchCourses({});
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="enrollment">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaClipboardList />
          Matricularse
        </Title>
        <Text>
          Selecciona un curso de la lista de cursos disponibles para
          matricularte.
        </Text>
      </div>

      {account && (
        <EnrollmentFeature.components.EnrollSelfForm
          periods={periods}
          courses={courses.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code,
          }))}
          onEnroll={enroll}
          loading={loading || coursesLoading}
        />
      )}
    </StudentLayout>
  );
}
