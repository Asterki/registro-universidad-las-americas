import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Typography, Switch } from "antd";
const { Title, Text } = Typography;

import AdminPageLayout from "../../layouts/Admin";
import { FaPlus, FaUniversity } from "react-icons/fa";

import FacultiesFeature from "../../features/faculties";

export const Route = createFileRoute("/admin/faculties")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { faculties, facultiesListState, fetchFaculties } =
    FacultiesFeature.hooks.useList({});

  //#region Create Faculty
  const {
    openModal: openCreateFacultyModal,
    closeModal: closeCreateFacultyModal,
    setState: setCreateFacultyModalState,
    state: createFacultyModalState,
    createFaculty: handleCreateFaculty,
  } = FacultiesFeature.hooks.useCreateModal({
    onSuccess: async () => {
      await fetchFaculties({});
    },
  });
  //#endregion

  //#region Delete Faculty
  const handleDeleteFaculty = async (facultyId: string) => {
    if (!facultyId) return;
    const result = await FacultiesFeature.api.delete({
      facultyId: facultyId,
    });

    if (result.status == "success") {
      message.success("Facultad eliminada exitosamente");
      fetchFaculties({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  //#region Restore a faculty
  const handleRestoreFaculty = async (facultyId: string) => {
    if (!facultyId) return;
    const result = await FacultiesFeature.api.restore({
      facultyId: facultyId,
    });

    if (result.status == "success") {
      message.success("Facultad restaurada exitosamente");
      fetchFaculties({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  // #region Update a faculty
  const {
    state: updateFacultyState,
    setState: setUpdateFacultyState,
    openDrawer: openUpdateFacultyDrawer,
    update: handleUpdateFaculty,
    reset: closeUpdateFacultyDrawer,
  } = FacultiesFeature.hooks.useUpdateDrawer({
    onSuccess: async () => {
      await fetchFaculties({});
    },
  });
  //#endregion

  useEffect(() => {
    if (!account) return; // Admin layout will handle this
    if (
      !account.data.role.permissions.includes("faculties:read") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso para acceder a esta página");
      navigate({ to: "/admin" });
      return;
    } else {
      (async () => {
        await fetchFaculties({ count: 50, page: 0 });
      })();
    }
  }, [account]);

  return (
    <AdminPageLayout selectedPage="institution-faculties">
      {/* Create Faculty */}
      <FacultiesFeature.components.CreateModal
        onClose={closeCreateFacultyModal}
        onCreate={handleCreateFaculty}
        state={createFacultyModalState}
        setState={setCreateFacultyModalState}
      />

      <FacultiesFeature.components.UpdateDrawer
        state={updateFacultyState}
        setState={setUpdateFacultyState}
        onClose={closeUpdateFacultyDrawer}
        onUpdate={handleUpdateFaculty}
      />

      <Title className="flex items-center gap-2">
        <FaUniversity />
        Facultades
      </Title>

      <Text>Gestiona las facultades de la institución.</Text>

      <div className="my-2 flex items-center gap-2">
        <Button
          variant="solid"
          type="primary"
          disabled={
            !account ||
            !(
              account?.data.role.permissions.includes("*") ||
              account?.data.role.permissions.includes("faculties:create")
            )
          }
          onClick={() => {
            openCreateFacultyModal();
          }}
          icon={<FaPlus />}
        >
          Crear Facultad
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchFaculties({
              search: {
                query: query.trim(),
                searchIn: ["name"],
              },
              count: 50,
              page: 0,
            });
          }}
          loading={facultiesListState.loading}
          enterButton="Buscar"
          placeholder="Buscar facultades..."
        />
      </div>

      {/* Faculties List */}
      {account && (
        <FacultiesFeature.components.FacultiesTable
          fetchFaculties={fetchFaculties}
          faculties={faculties}
          facultiesListState={facultiesListState}
          onRestore={(faculty) => {
            modal.confirm({
              title: "Restaurar facultad",
              content: `¿Estás seguro de que deseas restaurar la facultad "${faculty.name}"?`,
              onOk: () => handleRestoreFaculty(faculty.id),
            });
          }}
          onUpdate={(faculty) => {
            openUpdateFacultyDrawer(faculty.id);
          }}
          onDelete={(faculty) => {
            modal.confirm({
              title: "Eliminar facultad",
              content: `¿Estás seguro de que deseas eliminar la facultad "${faculty.name}"?`,
              onOk: () => handleDeleteFaculty(faculty.id),
            });
          }}
        />
      )}

      <div className="flex mt-4 gap-2 items-center">
        <Switch
          id="page-show-deleted"
          checked={facultiesListState.includeDeleted}
          onChange={(value) => {
            fetchFaculties({
              includeDeleted: value,
            });
          }}
        />

        <label htmlFor="page-show-deleted">Mostrar eliminados</label>
      </div>
    </AdminPageLayout>
  );
}
