import { Table, Tag } from "antd";
import { FaUserGraduate } from "react-icons/fa";

type CourseRosterTableProps = {
  students: any[];
  loading: boolean;
};

export function CourseRosterTable({ students, loading }: CourseRosterTableProps) {
  return (
    <Table
      className="w-full overflow-x-scroll"
      dataSource={students}
      rowKey={(record) => record.id ?? record._id ?? record.studentId ?? ""}
      loading={loading}
      columns={[
        {
          title: "#",
          key: "index",
          width: 50,
          render: (_: any, __: any, index: number) => index + 1,
        },
        {
          title: "Código",
          key: "code",
          dataIndex: ["student", "code"],
          render: (_: any, record: any) =>
            record.student?.code ?? record.code ?? record.studentCode ?? "-",
        },
        {
          title: "Nombre",
          key: "name",
          render: (_: any, record: any) => {
            const profile =
              record.student?.profile ?? record.profile ?? record.studentProfile ?? {};
            const name = profile.name ?? record.name ?? "";
            const lastName = profile.lastName ?? record.lastName ?? "";
            return `${name} ${lastName}`;
          },
        },
        {
          title: "Email",
          key: "email",
          render: (_: any, record: any) =>
            record.student?.email?.value ?? record.email ?? "-",
        },
        {
          title: "Estado",
          key: "status",
          dataIndex: "status",
          width: 100,
          render: (status: string) => (
            <Tag color={status === "active" || status === "enrolled" ? "green" : "default"}>
              {status === "active" || status === "enrolled" ? "Activo" : status}
            </Tag>
          ),
        },
      ]}
      pagination={{
        pageSize: 10,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
      }}
    />
  );
}
