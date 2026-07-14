import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { Typography } from "antd";
const { Title } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import RequestsFeature from "../../features/requests";

export const Route = createFileRoute("/instructor/my-requests")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { requests, loading, fetchRequests } = RequestsFeature.hooks.useMyRequests();

  useEffect(() => {
    if (account) {
      fetchRequests();
    }
  }, [account, fetchRequests]);

  return (
    <InstructorLayout selectedPage="my-requests">
      <Title level={3}>Mis Solicitudes</Title>
      <p className="text-gray-500 mb-4">
        Historial y estado de sus solicitudes académicas.
      </p>

      <RequestsFeature.components.MyRequestsTable
        requests={requests}
        loading={loading}
      />
    </InstructorLayout>
  );
}
