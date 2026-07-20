import { Table, Tag, Button, Space } from "antd";
import { FaTimes } from "react-icons/fa";

type MyEnrollmentsTableProps = {
  enrollments: any[];
  loading: boolean;
  onCancel: (enrollmentId: string) => void;
};

export function MyEnrollmentsTable({
  enrollments,
  loading,
  onCancel,
}: MyEnrollmentsTableProps) {
  const statusColors: Record<string, string> = {
    active: "blue",
    cancelled: "red",
    completed: "green",
    failed: "orange",
    pending: "gold",
  };

  const statusLabels: Record<string, string> = {
    active: "Activa",
    cancelled: "Cancelada",
    completed: "Completada",
    failed: "Reprobada",
    pending: "Pendiente",
  };

  console.log("Enrollments:", enrollments); // Debugging line

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={enrollments}
        columns={[
          {
            title: "Curso",
            key: "course",
            render: (_: any, record: any) => (
              <span>
                {record.course?.code} - {record.course?.name}
              </span>
            ),
          },
          {
            title: "Período",
            key: "period",
            dataIndex: ["period", "name"],
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
            title: "Fecha de Matrícula",
            key: "registeredAt",
            dataIndex: "registeredAt",
            render: (date: string) =>
              date ? new Date(date).toLocaleDateString("es-ES") : "-",
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: any) => (
              <Space>
                {record.status === "active" && (
                  <Button
                    danger
                    icon={<FaTimes />}
                    onClick={() => onCancel(record.id)}
                    size="small"
                  >
                    Cancelar
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} matrículas`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "No tienes matrículas registradas." }}
      />
    </div>
  );
}
