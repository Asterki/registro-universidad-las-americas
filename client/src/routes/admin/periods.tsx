import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Typography } from "antd";
const { Title, Text } = Typography;

import AdminPageLayout from "../../layouts/Admin";
import { FaPlus, FaCalendarAlt } from "react-icons/fa";

import PeriodsFeature from "../../features/periods";

export const Route = createFileRoute("/admin/periods")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { periods, periodsListState, fetchPeriods } =
    PeriodsFeature.hooks.usePeriodList({});

  //#region Create Period
  const {
    openModal: openCreatePeriodModal,
    closeModal: closeCreatePeriodModal,
    setState: setCreatePeriodModalState,
    state: createPeriodModalState,
    createPeriod: handleCreatePeriod,
  } = PeriodsFeature.hooks.useCreatePeriodModal({
    onSuccess: async () => {
      await fetchPeriods({});
    },
  });
  //#endregion

  //#region Delete Period
  const handleDeletePeriod = async (periodId: string) => {
    if (!periodId) return;
    const result = await PeriodsFeature.api.delete({
      periodId: periodId,
    });

    if (result.status == "success") {
      message.success("Período eliminado exitosamente");
      fetchPeriods({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  //#region Restore a period
  const handleRestorePeriod = async (periodId: string) => {
    if (!periodId) return;
    const result = await PeriodsFeature.api.restore({
      periodId: periodId,
    });

    if (result.status == "success") {
      message.success("Período restaurado exitosamente");
      fetchPeriods({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  // #region Update a period
  const {
    state: updatePeriodState,
    setState: setUpdatePeriodState,
    openDrawer: openUpdatePeriodDrawer,
    update: handleUpdatePeriod,
    reset: closeUpdatePeriodDrawer,
  } = PeriodsFeature.hooks.useUpdatePeriodDrawer({
    onSuccess: async () => {
      await fetchPeriods({});
    },
  });
  //#endregion

  useEffect(() => {
    if (!account) return; // Admin layout will handle this
    if (
      !account.data.role.permissions.includes("periods:read") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso para acceder a esta página");
      navigate({ to: "/admin" });
      return;
    } else {
      (async () => {
        await fetchPeriods({ count: 50, page: 0 });
      })();
    }
  }, [account]);

  return (
    <AdminPageLayout selectedPage="institution-periods">
      {/* Create Period */}
      <PeriodsFeature.components.CreatePeriodModal
        onClose={closeCreatePeriodModal}
        onCreate={handleCreatePeriod}
        state={createPeriodModalState}
        setState={setCreatePeriodModalState}
      />

      <PeriodsFeature.components.UpdatePeriodDrawer
        state={updatePeriodState}
        setState={setUpdatePeriodState}
        onClose={closeUpdatePeriodDrawer}
        onUpdate={handleUpdatePeriod}
      />

      <Title className="flex items-center gap-2">
        <FaCalendarAlt />
        Períodos Académicos
      </Title>

      <Text>Gestiona los períodos académicos.</Text>

      <div className="my-2 flex items-center gap-2">
        <Button
          variant="solid"
          type="primary"
          disabled={
            !account ||
            !(
              account?.data.role.permissions.includes("*") ||
              account?.data.role.permissions.includes("periods:create")
            )
          }
          onClick={() => {
            openCreatePeriodModal();
          }}
          icon={<FaPlus />}
        >
          Crear Período
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchPeriods({
              search: {
                query: query.trim(),
                searchIn: ["name"],
              },
              count: 50,
              page: 0,
            });
          }}
          loading={periodsListState.loading}
          enterButton="Buscar"
          placeholder="Buscar períodos..."
        />
      </div>

      {/* Periods List */}
      {account && (
        <PeriodsFeature.components.PeriodsTable
          fetchPeriods={fetchPeriods}
          periods={periods}
          periodsListState={periodsListState}
          showDeleted={periodsListState.includeDeleted ?? false}
          onShowDeletedChange={(value) => {
            fetchPeriods({
              includeDeleted: value,
            });
          }}
          onRestore={(period) => {
            modal.confirm({
              title: "Restaurar período",
              content: `¿Estás seguro de que deseas restaurar el período "${period.name}"?`,
              onOk: () => handleRestorePeriod(period.id),
            });
          }}
          onUpdate={(period) => {
            openUpdatePeriodDrawer(period.id);
          }}
          onDelete={(period) => {
            modal.confirm({
              title: "Eliminar período",
              content: `¿Estás seguro de que deseas eliminar el período "${period.name}"?`,
              onOk: () => handleDeletePeriod(period.id),
            });
          }}
        />
      )}
    </AdminPageLayout>
  );
}
