import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Input, Typography } from "antd";
const { Title, Text } = Typography;

import { FaUsers } from "react-icons/fa";

import RegistryLayout from "../../layouts/Registry";
import AccountsFeature from "../../features/accounts";

export const Route = createFileRoute("/registry/students")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message, modal } = App.useApp();

  const {
    accounts: students,
    accountsListState: studentsListState,
    fetchAccounts: fetchStudents,
  } = AccountsFeature.hooks.useAccountsList({});

  const handleDeleteStudent = async (accountId: string) => {
    const result = await AccountsFeature.api.delete({ accountId });
    if (result.status === "success") {
      message.success("Estudiante eliminado.");
      fetchStudents({ count: 50, page: 0, filters: { role: "student" } });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  const handleRestoreStudent = async (accountId: string) => {
    const result = await AccountsFeature.api.restore({ accountId });
    if (result.status === "success") {
      message.success("Estudiante restaurado.");
      fetchStudents({ count: 50, page: 0, filters: { role: "student" } });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  useEffect(() => {
    if (!account) return;
    if (
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso de estar en esta página.");
    } else {
      (async () => {
        await fetchStudents({
          count: 50,
          page: 0,
          filters: { role: "student" },
        });
      })();
    }
  }, [account]);

  return (
    <RegistryLayout selectedPage="registry-students">
      <div className="mb-2">
        {account && (
          <Text>
            Conectado como {account.profile.name} ({account.email.value})
          </Text>
        )}
      </div>

      <Title className="flex items-center gap-2">
        <FaUsers />
        Estudiantes
      </Title>

      <Text>Gestiona los estudiantes registrados en el sistema.</Text>

      {/* Search */}
      <div className="my-4 flex items-center gap-2">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchStudents({
              search: query.trim()
                ? { query: query.trim(), searchIn: ["name", "email"] }
                : undefined,
              count: 50,
              page: 0,
              filters: { role: "student" },
            });
          }}
          loading={studentsListState.loading}
          enterButton="Buscar"
          placeholder="Buscar estudiante..."
        />
      </div>

      {account && (
        <AccountsFeature.components.AccountsTable
          accounts={students}
          accountsListState={studentsListState}
          fetchAccounts={(params) =>
            fetchStudents({ ...params, filters: { role: "student", ...params?.filters } })
          }
          onUpdate={() => {}}
          onChangePassword={() => {}}
          onUpdateStatus={() => {}}
          onDelete={(acc) => {
            modal.confirm({
              title: "Eliminar estudiante",
              content: `¿Estás seguro de que deseas eliminar a ${acc.name}?`,
              onOk: () => handleDeleteStudent(acc.id),
            });
          }}
          onRestore={(acc) => {
            modal.confirm({
              title: "Restaurar estudiante",
              content: `¿Restaurar a ${acc.name}?`,
              onOk: () => handleRestoreStudent(acc.id),
            });
          }}
        />
      )}

      <div className="flex mt-4 gap-2 items-center">
        {/* Show deleted toggle - handled by AccountsTable internally */}
      </div>
    </RegistryLayout>
  );
}
