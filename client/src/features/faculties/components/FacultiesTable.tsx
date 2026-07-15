import { Table, Space, Dropdown, Button, Tag } from "antd";
import {
  FaPencilAlt,
  FaTrash,
  FaTrashRestore,
  FaEllipsisH,
} from "react-icons/fa";
import { ListFaculty } from "..";
import { useSelector } from "react-redux";
import { RootState } from "client/src/store";
import { hasPermissions } from "client/src/utils/permissions";

type FacultiesTableProps = {
  faculties: { faculties: ListFaculty[]; totalFaculties: number };
  facultiesListState: {
    count: number;
    page: number;
    loading: boolean;
  };
  fetchFaculties: (params: { count: number; page: number }) => void;
  onUpdate: (faculty: ListFaculty) => void;
  onDelete: (faculty: ListFaculty) => void;
  onRestore: (faculty: ListFaculty) => void;
};

export function FacultiesTable({
  faculties,
  facultiesListState,
  fetchFaculties,
  onUpdate,
  onDelete,
  onRestore,
}: FacultiesTableProps) {
  const { account } = useSelector((state: RootState) => state.auth);
  const accountPermissions = account?.data.role.permissions || [];

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={faculties.faculties}
        columns={[
          {
            title: "Nombre",
            key: "name",
            dataIndex: "name",
            render: (_: any, record: ListFaculty) => (
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
            title: "Decano",
            key: "dean",
            dataIndex: "dean",
          },
          {
            title: "Estado",
            key: "status",
            render: (_: any, record: ListFaculty) => (
              <Tag color={record.deleted ? "red" : "green"}>
                {record.deleted ? "Inactivo" : "Activo"}
              </Tag>
            ),
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: ListFaculty) => {
              const canUpdate =
                hasPermissions(accountPermissions, [
                  "*",
                  "faculties:update",
                ]);
              const canDelete =
                hasPermissions(accountPermissions, [
                  "*",
                  "faculties:delete",
                ]);
              const canRestore =
                hasPermissions(accountPermissions, [
                  "*",
                  "faculties:restore",
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
          pageSize: facultiesListState.count,
          total: faculties.totalFaculties,
          current: facultiesListState.page + 1,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total}`,
          showSizeChanger: true,
          onChange: (current, size) => {
            fetchFaculties({
              count: size,
              page: current - 1,
            });
          },
        }}
        rowKey="_id"
        loading={facultiesListState.loading}
      />
    </div>
  );
}
