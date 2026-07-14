import { Table, Tag, Typography } from "antd";
const { Text } = Typography;

type MyRequestsTableProps = {
  requests: any[];
  loading: boolean;
};

export function MyRequestsTable({ requests, loading }: MyRequestsTableProps) {
  const statusColors: Record<string, string> = {
    pending: "gold",
    reviewed: "blue",
    approved: "green",
    rejected: "red",
    resolved: "purple",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    reviewed: "En Revisión",
    approved: "Aprobada",
    rejected: "Rechazada",
    resolved: "Resuelta",
  };

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={requests}
        columns={[
          {
            title: "Tipo",
            key: "type",
            dataIndex: "type",
            render: (type: string) => {
              const labels: Record<string, string> = {
                academic_certificate: "Certificado Académico",
                study_load: "Carga de Estudios",
                subject_equivalence: "Equivalencia de Materias",
                schedule_change: "Cambio de Horario",
                special_permission: "Permiso Especial",
                others: "Otros",
              };
              return labels[type] || type;
            },
          },
          {
            title: "Descripción",
            key: "description",
            dataIndex: "description",
            ellipsis: true,
            render: (text: string) => (
              <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 300 }}>
                {text}
              </Text>
            ),
          },
          {
            title: "Facultad",
            key: "faculty",
            render: (_: any, record: any) =>
              record.faculty?.name || record.faculty || "-",
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
            title: "Fecha de Creación",
            key: "createdAt",
            dataIndex: "createdAt",
            render: (date: string) =>
              date ? new Date(date).toLocaleDateString("es-ES") : "-",
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} solicitudes`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "No tienes solicitudes registradas." }}
      />
    </div>
  );
}
