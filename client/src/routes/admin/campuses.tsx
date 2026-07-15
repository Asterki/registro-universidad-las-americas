import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useTranslation } from "react-i18next";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Typography, Switch } from "antd";
const { Title, Text } = Typography;

import AdminPageLayout from "../../layouts/Admin";
import { FaBuilding, FaPlus } from "react-icons/fa";

import CampusesFeature from "../../features/campuses";

export const Route = createFileRoute("/admin/campuses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { t: tCommon } = useTranslation(["common"]);

  const { campuses, campusesListState, fetchCampuses } =
    CampusesFeature.hooks.useList({});

  //#region Create Campus
  const {
    openModal: openCreateCampusModal,
    closeModal: closeCreateCampusModal,
    setState: setCreateCampusModalState,
    state: createCampusModalState,
    createCampus: handleCreateCampus,
  } = CampusesFeature.hooks.useCreateModal({
    onSuccess: async () => {
      await fetchCampuses({});
    },
  });
  //#endregion

  //#region Delete Campus
  const handleDeleteCampus = async (campusId: string) => {
    if (!campusId) return;
    const result = await CampusesFeature.api.delete({
      campusId: campusId,
    });

    if (result.status == "success") {
      message.success("Campus eliminado exitosamente");
      fetchCampuses({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  //#region Restore a campus
  const handleRestoreCampus = async (campusId: string) => {
    if (!campusId) return;
    const result = await CampusesFeature.api.restore({
      campusId: campusId,
    });

    if (result.status == "success") {
      message.success("Campus restaurado exitosamente");
      fetchCampuses({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  // #region Update a campus
  const {
    state: updateCampusState,
    setState: setUpdateCampusState,
    openDrawer: openUpdateCampusDrawer,
    update: handleUpdateCampus,
    reset: closeUpdateCampusDrawer,
  } = CampusesFeature.hooks.useUpdateDrawer({
    onSuccess: async () => {
      await fetchCampuses({});
    },
  });
  //#endregion

  useEffect(() => {
    if (!account) return; // Admin layout will handle this
    if (
      !account.data.role.permissions.includes("campuses:read") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso de estar en esta página.");
      navigate({ to: "/admin" });
      return;
    } else {
      (async () => {
        await fetchCampuses({ count: 50, page: 0 });
      })();
    }
  }, [account]);

  return (
    <AdminPageLayout selectedPage="institution-campuses">
      {/* Create Campus */}
      <CampusesFeature.components.CreateModal
        onClose={closeCreateCampusModal}
        onCreate={handleCreateCampus}
        state={createCampusModalState}
        setState={setCreateCampusModalState}
      />

      <CampusesFeature.components.UpdateDrawer
        state={updateCampusState}
        setState={setUpdateCampusState}
        onClose={closeUpdateCampusDrawer}
        onUpdate={handleUpdateCampus}
      />

      <div className="mb-2">
        {tCommon("loggedInAs", {
          name: account?.profile.name,
          email: account?.email.value,
        })}
      </div>

      <Title className="flex items-center gap-2">
        <FaBuilding />
        Campuses
      </Title>

      <Text>
        Maneja los campus de la institución, incluyendo su nombre, dirección y ciudad.
      </Text>

      <div className="my-2 flex items-center gap-2">
        <Button
          variant="solid"
          type="primary"
          disabled={
            !account ||
            !(
              account?.data.role.permissions.includes("*") ||
              account?.data.role.permissions.includes("campuses:create")
            )
          }
          onClick={() => {
            openCreateCampusModal();
          }}
          icon={<FaPlus />}
        >
          Crear Campus
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchCampuses({
              search: {
                query: query.trim(),
                searchIn: ["name"],
              },
              count: 50,
              page: 0,
            });
          }}
          loading={campusesListState.loading}
          enterButton={tCommon("search")}
          placeholder={"Buscar campus..."}
        />
      </div>

      {account && (
        <CampusesFeature.components.CampusesTable
          fetchCampuses={fetchCampuses}
          campuses={campuses}
          campusesListState={campusesListState}
          onRestore={(campus) => {
            modal.confirm({
              title: "Restaurar campus",
              content: "¿Estás seguro de que deseas restaurar el campus?",
              onOk: () => handleRestoreCampus(campus.id),
            });
          }}
          onUpdate={(campus) => {
            openUpdateCampusDrawer(campus.id);
          }}
          onDelete={(campus) => {
            modal.confirm({
              title: "Eliminar campus",
              content: "¿Estás seguro de que deseas eliminar el campus?",
              onOk: () => handleDeleteCampus(campus.id),
            });
          }}
        />
      )}

      <div className="flex mt-4 gap-2 items-center">
        <Switch
          id="page-show-deleted"
          checked={campusesListState.includeDeleted}
          onChange={(value) => {
            fetchCampuses({
              includeDeleted: value,
            });
          }}
        />

        <label htmlFor="page-show-deleted">Mostrar eliminados</label>
      </div>
    </AdminPageLayout>
  );
}
