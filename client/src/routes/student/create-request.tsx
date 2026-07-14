import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import RequestsFeature from "../../features/requests";
import { FaFileAlt } from "react-icons/fa";

export const Route = createFileRoute("/student/create-request")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { loading, createRequest } =
    RequestsFeature.hooks.useCreateRequest();

  const faculties: { id: string; name: string }[] = [
    // Faculties will come from a faculties API in production
  ];

  return (
    <StudentLayout selectedPage="create-request">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaFileAlt />
          Crear Solicitud
        </Title>
        <Text>
          Completa el formulario para crear una nueva solicitud académica o
          administrativa.
        </Text>
      </div>

      {account && (
        <RequestsFeature.components.CreateRequestForm
          faculties={faculties}
          onCreate={(data) => createRequest({ ...data, facultyId: data.facultyId || "" })}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
