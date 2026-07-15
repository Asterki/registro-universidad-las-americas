import { Table, Space, Dropdown, Button, Tag, Switch } from "antd";
import {
  FaPencilAlt,
  FaTrash,
  FaTrashRestore,
  FaEllipsisH,
} from "react-icons/fa";
import { ListCourse } from "../hooks/useCourseList";
import { useSelector } from "react-redux";
import { RootState } from "client/src/store";
import { hasPermissions } from "client/src/utils/permissions";

type CoursesTableProps = {
  courses: { courses: ListCourse[]; totalCourses: number };
  coursesListState: {
    count: number;
    page: number;
    loading: boolean;
    includeDeleted?: boolean;
  };
  fetchCourses: (params: { count: number; page: number; includeDeleted?: boolean }) => void;
  onUpdate: (course: ListCourse) => void;
  onDelete: (course: ListCourse) => void;
  onRestore: (course: ListCourse) => void;
  showDeleted: boolean;
  onShowDeletedChange: (checked: boolean) => void;
};

export function CoursesTable({
  courses,
  coursesListState,
  fetchCourses,
  onUpdate,
  onDelete,
  onRestore,
  showDeleted,
  onShowDeletedChange,
}: CoursesTableProps) {
  const { account } = useSelector((state: RootState) => state.auth);
  const accountPermissions = account?.data.role.permissions || [];

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={courses.courses}
        columns={[
          {
            title: "Nombre",
            key: "name",
            dataIndex: "name",
            render: (_: any, record: ListCourse) => (
              <span>
                {record.name}{" "}
                {record.deleted ? <Tag color="red">Eliminado</Tag> : ""}
              </span>
            ),
          },
          {
            title: "Código",
            key: "code",
            dataIndex: "code",
          },
          {
            title: "Créditos",
            key: "credits",
            dataIndex: "credits",
          },
          {
            title: "Estado",
            key: "status",
            render: (_: any, record: ListCourse) => (
              <Tag color={record.deleted ? "red" : "green"}>
                {record.deleted ? "Inactivo" : "Activo"}
              </Tag>
            ),
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: ListCourse) => {
              const canUpdate =
                hasPermissions(accountPermissions, [
                  "*",
                  "courses:update",
                ]);
              const canDelete =
                hasPermissions(accountPermissions, [
                  "*",
                  "courses:delete",
                ]);
              const canRestore =
                hasPermissions(accountPermissions, [
                  "*",
                  "courses:restore",
                ]);

              const menuItems = !record.deleted
                ? [
                  {
                    key: "update",
                    label: "Editar",
                    icon: <FaPencilAlt />,
                    disabled: !canUpdate,
                    onClick: () => onUpdate(record),
                  },
                  {
                    key: "delete",
                    label: "Eliminar",
                    danger: true,
                    icon: <FaTrash />,
                    disabled: !canDelete,
                    onClick: () => onDelete(record),
                  },
                ]
                : [
                  {
                    key: "restore",
                    label: "Restaurar",
                    icon: <FaTrashRestore />,
                    disabled: !canRestore || !record.deleted,
                    onClick: () => onRestore(record),
                  },
                ];

              return (
                <Space>
                  <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                    <Button icon={<FaEllipsisH />}>
                      Acciones
                    </Button>
                  </Dropdown>
                </Space>
              );
            },
          },
        ]}
        pagination={{
          pageSize: coursesListState.count,
          total: courses.totalCourses,
          current: coursesListState.page + 1,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total}`,
          showSizeChanger: true,
          onChange: (current, size) => {
            fetchCourses({
              count: size,
              page: current - 1,
            });
          },
        }}
        rowKey="_id"
        loading={coursesListState.loading}
      />
      <div className="mt-4 flex items-center gap-2">
        <Switch checked={showDeleted} onChange={onShowDeletedChange} />
        <span>Mostrar eliminados</span>
      </div>
    </div>
  );
}
