import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import { FaClipboardList } from "react-icons/fa";

import EnrollmentFeature from "../../features/enrollment";
import CoursesFeature from "../../features/courses";
import PeriodsFeature from "../../features/periods";

export const Route = createFileRoute("/student/enrollment")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message } = App.useApp();

  const { loading, enroll } = EnrollmentFeature.hooks.useEnrollSelf();
  const {
    courses,
    loading: coursesLoading,
    fetchCourses,
  } = CoursesFeature.hooks.useAvailableCourses();

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
          periods={periods.periods}
          courses={courses}
          onEnroll={enroll}
          loading={loading || coursesLoading}
        />
      )}
    </StudentLayout>
  );
}
