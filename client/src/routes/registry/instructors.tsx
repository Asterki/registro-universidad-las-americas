import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Input, Typography } from "antd";
const { Title, Text } = Typography;

import { FaChalkboardTeacher } from "react-icons/fa";

import RegistryLayout from "../../layouts/Registry";
import AccountsFeature from "../../features/accounts";

export const Route = createFileRoute("/registry/instructors")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { message, modal } = App.useApp();

  const {
    accounts: instructors,
    accountsListState: instructorsListState,
    fetchAccounts: fetchInstructors,
  } = AccountsFeature.hooks.useAccountsList({});

  const handleDeleteInstructor = async (accountId: string) => {
    const result = await AccountsFeature.api.delete({ accountId });
    if (result.status === "success") {
      message.success("Instructor eliminado.");
      fetchInstructors({ count: 50, page: 0, filters: { role: "instructor" } });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  const handleRestoreInstructor = async (accountId: string) => {
    const result = await AccountsFeature.api.restore({ accountId });
    if (result.status === "success") {
      message.success("Instructor restaurado.");
      fetchInstructors({ count: 50, page: 0, filters: { role: "instructor" } });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  useEffect(() => {
    if (!account) return;
    if (
      !account.data.role.permissions.includes("registry:list-instructors") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso de estar en esta página.");
    } else {
      (async () => {
        await fetchInstructors({
          count: 50,
          page: 0,
          filters: { role: "instructor" },
        });
      })();
    }
  }, [account]);

  return (
    <RegistryLayout selectedPage="registry-instructors">
      <div className="mb-2">
        {account && (
          <Text>
            Conectado como {account.profile.name} ({account.email.value})
          </Text>
        )}
      </div>

      <Title className="flex items-center gap-2">
        <FaChalkboardTeacher />
        Instructores
      </Title>

      <Text>Gestiona los instructores registrados en el sistema.</Text>

      {/* Search */}
      <div className="my-4 flex items-center gap-2">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchInstructors({
              search: query.trim()
                ? { query: query.trim(), searchIn: ["name", "email"] }
                : undefined,
              count: 50,
              page: 0,
              filters: { role: "instructor" },
            });
          }}
          loading={instructorsListState.loading}
          enterButton="Buscar"
          placeholder="Buscar instructor..."
        />
      </div>

      {account && (
        <AccountsFeature.components.AccountsTable
          accounts={instructors}
          accountsListState={instructorsListState}
          fetchAccounts={(params) =>
            fetchInstructors({ ...params, filters: { role: "instructor", ...params?.filters } })
          }
          onUpdate={() => {}}
          onChangePassword={() => {}}
          onUpdateStatus={() => {}}
          onDelete={(acc) => {
            modal.confirm({
              title: "Eliminar instructor",
              content: `¿Estás seguro de que deseas eliminar a ${acc.name}?`,
              onOk: () => handleDeleteInstructor(acc.id),
            });
          }}
          onRestore={(acc) => {
            modal.confirm({
              title: "Restaurar instructor",
              content: `¿Restaurar a ${acc.name}?`,
              onOk: () => handleRestoreInstructor(acc.id),
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
