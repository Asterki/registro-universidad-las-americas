import { Table, Tag, Typography } from "antd";
const { Text } = Typography;

type AvailableCoursesTableProps = {
  courses: any[];
  loading: boolean;
  onEnroll?: (courseId: string) => void;
};

export function AvailableCoursesTable({
  courses,
  loading,
}: AvailableCoursesTableProps) {
  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={courses}
        columns={[
          {
            title: "Código",
            key: "code",
            dataIndex: "code",
          },
          {
            title: "Nombre",
            key: "name",
            dataIndex: "name",
          },
          {
            title: "Créditos",
            key: "credits",
            dataIndex: "credits",
            render: (credits: number) => (
              <Tag>{credits} créditos</Tag>
            ),
          },
          {
            title: "Facultad",
            key: "faculty",
            render: (_: any, record: any) =>
              record.faculty?.name || record.faculty || "-",
          },
          {
            title: "Instructor",
            key: "instructor",
            render: (_: any, record: any) =>
              record.instructor?.name || record.instructor || "Por asignar",
          },
          {
            title: "Cupo",
            key: "capacity",
            render: (_: any, record: any) => {
              const enrolled = record.enrolledCount ?? 0;
              const capacity = record.capacity ?? 0;
              const remaining = capacity - enrolled;
              return (
                <Text>
                  {enrolled}/{capacity} ({remaining} disponibles)
                </Text>
              );
            },
          },
          {
            title: "Estado",
            key: "status",
            dataIndex: "status",
            render: (status: string) => {
              const colors: Record<string, string> = {
                active: "green",
                inactive: "red",
                full: "orange",
              };
              const labels: Record<string, string> = {
                active: "Disponible",
                inactive: "No disponible",
                full: "Lleno",
              };
              return (
                <Tag color={colors[status] || "default"}>
                  {labels[status] || status}
                </Tag>
              );
            },
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} cursos`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: "No hay cursos disponibles." }}
      />
    </div>
  );
}
