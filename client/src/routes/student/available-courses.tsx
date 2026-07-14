import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import CoursesFeature from "../../features/courses";
import { FaBook } from "react-icons/fa";

export const Route = createFileRoute("/student/available-courses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { courses, loading, fetchCourses } =
    CoursesFeature.hooks.useAvailableCourses();

  useEffect(() => {
    if (account) {
      fetchCourses({});
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="available-courses">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaBook />
          Cursos Disponibles
        </Title>
        <Text>
          Explora la oferta académica de cursos disponibles para matrícula.
        </Text>
      </div>

      {account && (
        <CoursesFeature.components.AvailableCoursesTable
          courses={courses}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
