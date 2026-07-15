import { Table, Space, Dropdown, Button, Tag, Switch } from "antd";
import {
  FaPencilAlt,
  FaTrash,
  FaTrashRestore,
  FaEllipsisH,
} from "react-icons/fa";
import { ListPeriod } from "..";
import { useSelector } from "react-redux";
import { RootState } from "client/src/store";
import { hasPermissions } from "client/src/utils/permissions";
import dayjs from "dayjs";

type PeriodsTableProps = {
  periods: { periods: ListPeriod[]; totalPeriods: number };
  periodsListState: {
    count: number;
    page: number;
    loading: boolean;
    includeDeleted?: boolean;
  };
  fetchPeriods: (params: { count: number; page: number; includeDeleted?: boolean }) => void;
  onUpdate: (period: ListPeriod) => void;
  onDelete: (period: ListPeriod) => void;
  onRestore: (period: ListPeriod) => void;
  showDeleted: boolean;
  onShowDeletedChange: (checked: boolean) => void;
};

export function PeriodsTable({
  periods,
  periodsListState,
  fetchPeriods,
  onUpdate,
  onDelete,
  onRestore,
  showDeleted,
  onShowDeletedChange,
}: PeriodsTableProps) {
  const { account } = useSelector((state: RootState) => state.auth);
  const accountPermissions = account?.data.role.permissions || [];

  return (
    <div className="mt-4">
      <Table
        className="w-full overflow-x-scroll"
        dataSource={periods.periods}
        columns={[
          {
            title: "Nombre",
            key: "name",
            dataIndex: "name",
            render: (_: any, record: ListPeriod) => (
              <span>
                {record.name}{" "}
                {record.deleted ? <Tag color="red">Eliminado</Tag> : ""}
              </span>
            ),
          },
          {
            title: "Fecha de Inicio",
            key: "startDate",
            render: (_: any, record: ListPeriod) => (
              <span>{dayjs(record.startDate).format("DD/MM/YYYY")}</span>
            ),
          },
          {
            title: "Fecha de Fin",
            key: "endDate",
            render: (_: any, record: ListPeriod) => (
              <span>{dayjs(record.endDate).format("DD/MM/YYYY")}</span>
            ),
          },
          {
            title: "Estado",
            key: "status",
            render: (_: any, record: ListPeriod) => (
              <Tag color={record.deleted ? "red" : record.active ? "green" : "orange"}>
                {record.deleted ? "Inactivo" : record.active ? "Activo" : "Inactivo"}
              </Tag>
            ),
          },
          {
            title: "Acciones",
            key: "actions",
            fixed: "right",
            render: (_: any, record: ListPeriod) => {
              const canUpdate =
                hasPermissions(accountPermissions, [
                  "*",
                  "periods:update",
                ]);
              const canDelete =
                hasPermissions(accountPermissions, [
                  "*",
                  "periods:delete",
                ]);
              const canRestore =
                hasPermissions(accountPermissions, [
                  "*",
                  "periods:restore",
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
          pageSize: periodsListState.count,
          total: periods.totalPeriods,
          current: periodsListState.page + 1,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total}`,
          showSizeChanger: true,
          onChange: (current, size) => {
            fetchPeriods({
              count: size,
              page: current - 1,
            });
          },
        }}
        rowKey="_id"
        loading={periodsListState.loading}
      />
      <div className="mt-4 flex items-center gap-2">
        <Switch checked={showDeleted} onChange={onShowDeletedChange} />
        <span>Mostrar eliminados</span>
      </div>
    </div>
  );
}
