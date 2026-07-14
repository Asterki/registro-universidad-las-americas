import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import RequestsFeature from "../../features/requests";
import { FaFileAlt } from "react-icons/fa";

export const Route = createFileRoute("/student/my-requests")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { requests, loading, fetchRequests } =
    RequestsFeature.hooks.useMyRequests();

  useEffect(() => {
    if (account) {
      fetchRequests({});
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="my-requests">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaFileAlt />
          Mis Solicitudes
        </Title>
        <Text>
          Consulta el estado de todas tus solicitudes realizadas.
        </Text>
      </div>

      {account && (
        <RequestsFeature.components.MyRequestsTable
          requests={requests}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
