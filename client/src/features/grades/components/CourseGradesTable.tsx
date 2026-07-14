import { Table, Tag } from "antd";

type CourseGradesTableProps = {
  grades: any[];
  loading: boolean;
};

export function CourseGradesTable({ grades, loading }: CourseGradesTableProps) {
  return (
    <Table
      className="w-full overflow-x-scroll"
      dataSource={grades}
      rowKey={(record) => record.id ?? record._id ?? ""}
      loading={loading}
      columns={[
        {
          title: "#",
          key: "index",
          width: 50,
          render: (_: any, __: any, index: number) => index + 1,
        },
        {
          title: "Estudiante",
          key: "student",
          render: (_: any, record: any) => {
            const enrollment = record.enrollment ?? {};
            const student = enrollment.student ?? {};
            const profile = student.profile ?? {};
            const name = profile.name ?? record.studentName ?? "";
            const lastName = profile.lastName ?? record.studentLastName ?? "";
            return `${name} ${lastName}`;
          },
        },
        {
          title: "Código",
          key: "code",
          render: (_: any, record: any) =>
            record.enrollment?.student?.code ?? record.studentCode ?? "-",
        },
        {
          title: "Tipo",
          key: "type",
          dataIndex: "type",
          width: 120,
        },
        {
          title: "Nota",
          key: "score",
          dataIndex: "score",
          width: 80,
          align: "center" as const,
          render: (score: number) => (
            <Tag color={score >= 70 ? "green" : score >= 60 ? "orange" : "red"}>
              {score ?? "-"}
            </Tag>
          ),
        },
        {
          title: "Descripción",
          key: "description",
          dataIndex: "description",
          ellipsis: true,
        },
        {
          title: "Fecha",
          key: "createdAt",
          dataIndex: "createdAt",
          width: 120,
          render: (date: string) =>
            date ? new Date(date).toLocaleDateString("es-ES") : "-",
        },
      ]}
      pagination={{
        pageSize: 10,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
      }}
    />
  );
}
