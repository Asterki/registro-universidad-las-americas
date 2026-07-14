import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { Typography } from "antd";
const { Title } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import CourseInstructorFeature from "../../features/course-instructor";

export const Route = createFileRoute("/instructor/my-courses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { courses, loading, fetchCourses } = CourseInstructorFeature.hooks.useMyCourses();

  useEffect(() => {
    if (account) {
      fetchCourses();
    }
  }, [account, fetchCourses]);

  return (
    <InstructorLayout selectedPage="my-courses">
      <Title level={3}>Cursos Asignados</Title>
      <p className="text-gray-500 mb-4">
        Lista de cursos que tiene asignados para el periodo actual.
      </p>

      <CourseInstructorFeature.components.MyCoursesTable
        courses={courses}
        loading={loading}
      />
    </InstructorLayout>
  );
}
