import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Table, Tag, Typography, Space } from "antd";
const { Title, Text } = Typography;

import { FaClipboardList, FaEye, FaCheck, FaTimes } from "react-icons/fa";

import RegistryLayout from "../../layouts/Registry";
import RequestsFeature from "../../features/requests";

export const Route = createFileRoute("/registry/requests")({
  component: RouteComponent,
});

const statusColors: Record<string, string> = {
  pending: "gold",
  in_review: "blue",
  approved: "green",
  rejected: "red",
  resolved: "purple",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En Revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  resolved: "Resuelta",
};

const requestTypeLabels: Record<string, string> = {
  academic_certificate: "Certificado Académico",
  study_load: "Carga de Estudios",
  subject_equivalence: "Equivalencia de Materias",
  schedule_change: "Cambio de Horario",
  special_permission: "Permiso Especial",
  others: "Otros",
};

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message, modal } = App.useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = useCallback(async (status?: string) => {
    setRequestsLoading(true);
    try {
      const result = await RequestsFeature.api.list({
        page: 0,
        count: 50,
        ...(status ? { status } : {}),
      } as any);
      if (result.status === "success") {
        setRequests(result.requests || []);
      } else {
        message.error("Error al cargar solicitudes.");
      }
    } catch {
      message.error("Error al cargar solicitudes.");
    } finally {
      setRequestsLoading(false);
    }
  }, [message]);

  const handleFilterChange = (status?: string) => {
    setRequestFilter(status);
    fetchRequests(status);
  };

  const handleReviewRequest = async (requestId: string) => {
    const result = await RequestsFeature.api.review({ requestId } as any);
    if (result.status === "success") {
      message.success("Solicitud marcada como en revisión.");
      fetchRequests(requestFilter);
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const result = await RequestsFeature.api.approve({ requestId } as any);
    if (result.status === "success") {
      message.success("Solicitud aprobada exitosamente.");
      fetchRequests(requestFilter);
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const result = await RequestsFeature.api.reject({ requestId, response: "Rechazado por registro" } as any);
    if (result.status === "success") {
      message.success("Solicitud rechazada.");
      fetchRequests(requestFilter);
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  useEffect(() => {
    if (!account) return;
    if (
      !account.data.role.permissions.includes("registry:list-requests") &&
      !account.data.role.permissions.includes("*") &&
      !account.data.role.permissions.includes("requests:list")
    ) {
      message.error("No tienes permiso de estar en esta página.");
    } else {
      fetchRequests();
    }
  }, [account]);

  return (
    <RegistryLayout selectedPage="registry-requests">
      <div className="mb-2">
        {account && (
          <Text>
            Conectado como {account.profile.name} ({account.email.value})
          </Text>
        )}
      </div>

      <Title className="flex items-center gap-2">
        <FaClipboardList />
        Solicitudes
      </Title>

      <Text>Gestiona las solicitudes académicas — revisa, aprueba o rechaza.</Text>

      {/* Search */}
      <div className="my-4 flex items-center gap-2">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            setSearchQuery(query);
            // The API doesn't have a search filter, but we keep the input for UX
          }}
          loading={requestsLoading}
          enterButton="Buscar"
          placeholder="Buscar solicitud..."
        />
      </div>

      {/* Filter buttons */}
      <div className="my-2 flex items-center gap-2 flex-wrap">
        <Button
          type={!requestFilter ? "primary" : "default"}
          onClick={() => handleFilterChange(undefined)}
        >
          Todas
        </Button>
        <Button
          type={requestFilter === "pending" ? "primary" : "default"}
          onClick={() => handleFilterChange("pending")}
        >
          Pendientes
        </Button>
        <Button
          type={requestFilter === "in_review" ? "primary" : "default"}
          onClick={() => handleFilterChange("in_review")}
        >
          En Revisión
        </Button>
        <Button
          type={requestFilter === "approved" ? "primary" : "default"}
          onClick={() => handleFilterChange("approved")}
        >
          Aprobadas
        </Button>
        <Button
          type={requestFilter === "rejected" ? "primary" : "default"}
          onClick={() => handleFilterChange("rejected")}
        >
          Rechazadas
        </Button>
      </div>

      <Table
        className="w-full overflow-x-scroll mt-4"
        dataSource={requests}
        columns={[
          {
            title: "Solicitante",
            key: "account",
            render: (_: any, record: any) =>
              record.account?.name || record.accountId || "-",
          },
          {
            title: "Tipo",
            key: "type",
            dataIndex: "type",
            render: (type: string) => requestTypeLabels[type] || type,
          },
          {
            title: "Descripción",
            key: "description",
            dataIndex: "description",
            ellipsis: true,
            render: (text: string) => (
              <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 250 }}>
                {text || "-"}
              </Text>
            ),
          },
          {
            title: "Facultad",
            key: "faculty",
            render: (_: any, record: any) =>
              record.faculty?.name || record.facultyId || "-",
          },
          {
            title: "Estado",
            key: "status",
            dataIndex: "status",
            render: (status: string) => (
              <Tag color={statusColors[status] || "default"}>
                {statusLabels[status] || status}
              </Tag>
            ),
          },
          {
            title: "Fecha",
            key: "date",
            dataIndex: "date",
            render: (date: string) =>
              date ? new Date(date).toLocaleDateString("es-ES") : "-",
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: any) => (
              <Space>
                {record.status === "pending" && (
                  <>
                    <Button
                      type="primary"
                      size="small"
                      icon={<FaEye />}
                      onClick={() => handleReviewRequest(record.id)}
                    >
                      Revisar
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<FaCheck />}
                      style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      onClick={() => {
                        modal.confirm({
                          title: "Aprobar solicitud",
                          content: "¿Estás seguro de que deseas aprobar esta solicitud?",
                          onOk: () => handleApproveRequest(record.id),
                        });
                      }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<FaTimes />}
                      onClick={() => {
                        modal.confirm({
                          title: "Rechazar solicitud",
                          content: "¿Estás seguro de que deseas rechazar esta solicitud?",
                          onOk: () => handleRejectRequest(record.id),
                        });
                      }}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                {record.status === "in_review" && (
                  <>
                    <Button
                      type="primary"
                      size="small"
                      icon={<FaCheck />}
                      style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      onClick={() => {
                        modal.confirm({
                          title: "Aprobar solicitud",
                          content: "¿Estás seguro de que deseas aprobar esta solicitud?",
                          onOk: () => handleApproveRequest(record.id),
                        });
                      }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<FaTimes />}
                      onClick={() => {
                        modal.confirm({
                          title: "Rechazar solicitud",
                          content: "¿Estás seguro de que deseas rechazar esta solicitud?",
                          onOk: () => handleRejectRequest(record.id),
                        });
                      }}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                {(record.status === "approved" || record.status === "rejected" || record.status === "resolved") && (
                  <Tag>{statusLabels[record.status]}</Tag>
                )}
              </Space>
            ),
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} solicitudes`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={requestsLoading}
        locale={{ emptyText: "No hay solicitudes registradas." }}
      />
    </RegistryLayout>
  );
}
