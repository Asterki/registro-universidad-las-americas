import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { FaBook } from "react-icons/fa";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import CoursesFeature from "../../features/courses";
import PeriodsFeature from "../../features/periods";

export const Route = createFileRoute("/student/available-courses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message } = App.useApp();

  const { courses, loading, fetchCourses } =
    CoursesFeature.hooks.useAvailableCourses();


  const { periods, fetchPeriods } = PeriodsFeature.hooks.usePeriodList({});

  useEffect(() => {
    if (account) {
      if (!account.data.facultyId || !account.data.campusId) {
        message.error(
          "Para poder matricularse a clases, primero debes de estar matriculado a la universidad.",
        );
        return;
      }

      fetchPeriods({
        active: true,
      });
    }
  }, [account]);

  useEffect(() => {
    if (account && periods.periods.length > 0) {
      fetchCourses({
        facultyId: account.data.facultyId,
        periodId: periods.periods[0]?.id,
      });
    }
  }, [account, periods.periods]);

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
