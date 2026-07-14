import { Table, Tag, Typography } from "antd";
const { Text } = Typography;

type MyGradesTableProps = {
  grades: any[];
  loading: boolean;
};

export function MyGradesTable({ grades, loading }: MyGradesTableProps) {
  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={grades}
        columns={[
          {
            title: "Curso",
            key: "course",
            render: (_: any, record: any) => (
              <span>
                {record.enrollment?.course?.code} -{" "}
                {record.enrollment?.course?.name}
              </span>
            ),
          },
          {
            title: "Período",
            key: "period",
            render: (_: any, record: any) =>
              record.enrollment?.period?.name || "-",
          },
          {
            title: "Nota",
            key: "value",
            dataIndex: "value",
            render: (value: number) => (
              <Text strong>
                {value !== null && value !== undefined ? value.toFixed(2) : "N/A"}
              </Text>
            ),
          },
          {
            title: "Letra",
            key: "letter",
            dataIndex: "letter",
            render: (letter: string) => {
              const colorMap: Record<string, string> = {
                A: "green",
                B: "blue",
                C: "gold",
                D: "orange",
                F: "red",
              };
              return (
                <Tag color={colorMap[letter] || "default"}>
                  {letter || "N/A"}
                </Tag>
              );
            },
          },
          {
            title: "Estado",
            key: "status",
            dataIndex: "status",
            render: (status: string) => {
              const statusLabels: Record<string, string> = {
                final: "Final",
                partial: "Parcial",
                draft: "Borrador",
              };
              return (
                <Tag>{statusLabels[status] || status || "N/A"}</Tag>
              );
            },
          },
          {
            title: "Fecha de Registro",
            key: "createdAt",
            dataIndex: "createdAt",
            render: (date: string) =>
              date ? new Date(date).toLocaleDateString("es-ES") : "-",
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} notas`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "No tienes notas registradas." }}
      />
    </div>
  );
}
