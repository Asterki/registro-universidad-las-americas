import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import EnrollmentFeature from "../../features/enrollment";
import { FaListAlt } from "react-icons/fa";

export const Route = createFileRoute("/student/my-enrollments")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { modal } = App.useApp();

  const { enrollments, loading, fetchEnrollments, cancelEnrollment } =
    EnrollmentFeature.hooks.useMyEnrollments();

  useEffect(() => {
    if (account) {
      fetchEnrollments({});
    }
  }, [account]);

  const handleCancel = (enrollmentId: string) => {
    modal.confirm({
      title: "Cancelar Matrícula",
      content:
        "¿Estás seguro de que deseas cancelar esta matrícula? Esta acción no se puede deshacer.",
      okText: "Sí, cancelar",
      okType: "danger",
      cancelText: "No, mantener",
      onOk: () => cancelEnrollment(enrollmentId),
    });
  };

  return (
    <StudentLayout selectedPage="my-enrollments">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaListAlt />
          Mis Matrículas
        </Title>
        <Text>
          Consulta y gestiona tus matrículas activas e históricas.
        </Text>
      </div>

      {account && (
        <EnrollmentFeature.components.MyEnrollmentsTable
          enrollments={enrollments}
          loading={loading}
          onCancel={handleCancel}
        />
      )}
    </StudentLayout>
  );
}
