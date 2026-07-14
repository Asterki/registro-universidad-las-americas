import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";

import { Typography } from "antd";
const { Title } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import { useCreateRequest } from "../../features/requests/hooks/useCreateRequest";
import { CreateRequestForm } from "../../features/requests/components/CreateRequestForm";

export const Route = createFileRoute("/instructor/create-request")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { createRequest, loading } = useCreateRequest();
  const navigate = useNavigate();

  const handleSubmit = async (values: { type: string; description: string; facultyId?: string }) => {
    const success = await createRequest(values as { type: string; description: string; facultyId: string });
    if (success) {
      navigate({ to: "/instructor/my-requests" as any });
    }
  };

  return (
    <InstructorLayout selectedPage="create-request">
      <Title level={3}>Crear Solicitud</Title>
      <p className="text-gray-500 mb-4">
        Complete el formulario para crear una nueva solicitud académica.
      </p>

      <CreateRequestForm faculties={[]} onCreate={handleSubmit} loading={loading} />
    </InstructorLayout>
  );
}
