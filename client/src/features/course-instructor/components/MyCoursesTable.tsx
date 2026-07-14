import { Table, Button, Space, Tag } from "antd";
import { useNavigate } from "@tanstack/react-router";
import { FaList, FaPenAlt, FaEye } from "react-icons/fa";
import type { CourseAssignment } from "../hooks/useMyCourses";

type MyCoursesTableProps = {
  courses: CourseAssignment[];
  loading: boolean;
};

export function MyCoursesTable({ courses, loading }: MyCoursesTableProps) {
  const navigate = useNavigate();

  return (
    <Table
      className="w-full overflow-x-scroll"
      dataSource={courses}
      rowKey="id"
      loading={loading}
      columns={[
        {
          title: "Código",
          key: "courseCode",
          dataIndex: "courseCode",
          width: 120,
        },
        {
          title: "Nombre del Curso",
          key: "courseName",
          dataIndex: "courseName",
        },
        {
          title: "Facultad",
          key: "faculty",
          dataIndex: "faculty",
        },
        {
          title: "Periodo",
          key: "period",
          dataIndex: "period",
          width: 100,
        },
        {
          title: "Horario",
          key: "schedule",
          dataIndex: "schedule",
        },
        {
          title: "Aula",
          key: "classroom",
          dataIndex: "classroom",
          width: 80,
        },
        {
          title: "Inscritos",
          key: "enrolledCount",
          dataIndex: "enrolledCount",
          width: 90,
          align: "center",
        },
        {
          title: "Estado",
          key: "status",
          dataIndex: "status",
          width: 100,
          render: (status: string) => (
            <Tag color={status === "active" ? "green" : "default"}>
              {status === "active" ? "Activo" : status}
            </Tag>
          ),
        },
        {
          title: "Acciones",
          key: "actions",
          fixed: "right",
          width: 180,
          render: (_: any, record: CourseAssignment) => (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<FaList />}
                onClick={() => navigate({ to: "/instructor/class-roster" as any })}
              >
                Lista
              </Button>
              <Button
                size="small"
                icon={<FaPenAlt />}
                onClick={() => navigate({ to: "/instructor/record-grades" as any })}
              >
                Notas
              </Button>
              <Button
                size="small"
                icon={<FaEye />}
                onClick={() => navigate({ to: "/instructor/course-detail" as any })}
              >
                Ver
              </Button>
            </Space>
          ),
        },
      ]}
      pagination={{
        pageSize: 10,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
        showSizeChanger: true,
      }}
    />
  );
}
