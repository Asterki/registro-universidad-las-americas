import { Table, Space, Dropdown, Button, Tag } from "antd";
import { useTranslation } from "react-i18next";
import {
  FaPencilAlt,
  FaTrash,
  FaTrashRestore,
  FaEllipsisH,
} from "react-icons/fa";
import { ListCampus } from "..";
import { useSelector } from "react-redux";
import { RootState } from "client/src/store";
import { hasPermissions } from "client/src/utils/permissions";

type CampusTableProps = {
  campuses: { campuses: ListCampus[]; totalCampuses: number };
  campusesListState: {
    count: number;
    page: number;
    loading: boolean;
  };
  fetchCampuses: (params: { count: number; page: number }) => void;
  onUpdate: (account: ListCampus) => void;
  onDelete: (account: ListCampus) => void;
  onRestore: (account: ListCampus) => void;
};

export function CampusesTable({
  campuses,
  campusesListState,
  fetchCampuses,
  onUpdate,
  onDelete,
  onRestore,
}: CampusTableProps) {
  const { t } = useTranslation(["features"], {
    keyPrefix: "campuses.components.table",
  });
  const { account } = useSelector((state: RootState) => state.auth);
  const accountPermissions = account?.data.role.permissions || [];

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={campuses.campuses}
        columns={[
          {
            title: "Nombre",
            key: "name",
            dataIndex: "name",
            render: (_: any, record: ListCampus) => (
              <span>
                {record.name}{" "}
                {record.deleted ? <Tag color="red">{t("deleted")}</Tag> : ""}
              </span>
            ),
          },
          {
            title: "Ciudad",
            key: "city",
            dataIndex: "city",
          },
          {
            title: "Dirección",
            key: "address",
            dataIndex: "address",
          },
          {
            title: "Teléfono",
            key: "phone",
            dataIndex: "phone",
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: ListCampus) => {
              const canUpdate =
                hasPermissions(accountPermissions, [
                  "*",
                  "campuses:update",
                ])
              const canDelete =
                hasPermissions(accountPermissions, [
                  "*",
                  "campuses:delete",
                ])
              const canRestore =
                hasPermissions(accountPermissions, [
                  "*",
                  "campuses:restore",
                ])

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
                    className: record.deleted ? "hidden" : "",
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
          pageSize: campusesListState.count,
          total: campuses.totalCampuses,
          current: campusesListState.page + 1,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} campus`,
          showSizeChanger: true,
          onChange: (current, size) => {
            fetchCampuses({
              count: size,
              page: current - 1,
            });
          },
        }}
        rowKey="_id"
        loading={campusesListState.loading}
      />
    </div>
  );
}
