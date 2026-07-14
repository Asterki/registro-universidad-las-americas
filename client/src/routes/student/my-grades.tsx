import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import GradesFeature from "../../features/grades";
import { FaStar } from "react-icons/fa";

export const Route = createFileRoute("/student/my-grades")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { grades, loading, fetchGrades } =
    GradesFeature.hooks.useMyGrades();

  useEffect(() => {
    if (account) {
      fetchGrades({});
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="my-grades">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaStar />
          Mis Notas
        </Title>
        <Text>
          Revisa las calificaciones de todos tus cursos.
        </Text>
      </div>

      {account && (
        <GradesFeature.components.MyGradesTable
          grades={grades}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
