import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Typography } from "antd";
const { Title, Text } = Typography;

import RegistryLayout from "../../layouts/Registry";
import { FaPlus, FaBook } from "react-icons/fa";

import CoursesFeature from "../../features/courses";
import FacultiesFeature from "../../features/faculties";
import PeriodsFeature from "../../features/periods";

export const Route = createFileRoute("/registry/courses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { courses, coursesListState, fetchCourses } =
    CoursesFeature.hooks.useCourseList({});

  const { faculties, fetchFaculties } = FacultiesFeature.hooks.useList({});
  const { periods, fetchPeriods } = PeriodsFeature.hooks.usePeriodList({});

  //#region Create Course
  const {
    openModal: openCreateCourseModal,
    closeModal: closeCreateCourseModal,
    setState: setCreateCourseModalState,
    state: createCourseModalState,
    createCourse: handleCreateCourse,
  } = CoursesFeature.hooks.useCreateCourseModal({
    onSuccess: async () => {
      await fetchCourses({});
    },
  });
  //#endregion

  //#region Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!courseId) return;
    const result = await CoursesFeature.api.delete({
      courseId: courseId,
    });

    if (result.status == "success") {
      message.success("Curso eliminado exitosamente");
      fetchCourses({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  //#region Restore a course
  const handleRestoreCourse = async (courseId: string) => {
    if (!courseId) return;
    const result = await CoursesFeature.api.restore({
      courseId: courseId,
    });

    if (result.status == "success") {
      message.success("Curso restaurado exitosamente");
      fetchCourses({ count: 50, page: 0 });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };
  //#endregion

  // #region Update a course
  const {
    state: updateCourseState,
    setState: setUpdateCourseState,
    openDrawer: openUpdateCourseDrawer,
    update: handleUpdateCourse,
    reset: closeUpdateCourseDrawer,
  } = CoursesFeature.hooks.useUpdateCourseDrawer({
    onSuccess: async () => {
      await fetchCourses({});
    },
  });
  //#endregion

  useEffect(() => {
    if (!account) return; // Registry layout will handle auth
    if (
      !account.data.role.permissions.includes("courses:list") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error("No tienes permiso para acceder a esta página");
      navigate({ to: "/registry" });
      return;
    } else {
      (async () => {
        await fetchCourses({ count: 50, page: 0 });
        await fetchFaculties({ count: 50, page: 0 });
        await fetchPeriods({ count: 50, page: 0 });
      })();
    }
  }, [account]);

  return (
    <RegistryLayout selectedPage="courses">
      {/* Create Course */}
      <CoursesFeature.components.CreateCourseModal
        onClose={closeCreateCourseModal}
        onCreate={handleCreateCourse}
        state={createCourseModalState}
        setState={setCreateCourseModalState}
        faculties={faculties.faculties}
        periods={periods.periods}
      />

      <CoursesFeature.components.UpdateCourseDrawer
        state={updateCourseState}
        setState={setUpdateCourseState}
        onClose={closeUpdateCourseDrawer}
        onUpdate={handleUpdateCourse}
        faculties={faculties.faculties}
        periods={periods.periods}
      />

      <Title className="flex items-center gap-2">
        <FaBook />
        Cursos
      </Title>

      <Text>Gestiona los cursos académicos del registro universitario.</Text>

      <div className="my-2 flex items-center gap-2">
        <Button
          variant="solid"
          type="primary"
          disabled={
            !account ||
            !(
              account?.data.role.permissions.includes("*") ||
              account?.data.role.permissions.includes("courses:create")
            )
          }
          onClick={() => {
            openCreateCourseModal();
          }}
          icon={<FaPlus />}
        >
          Crear Curso
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchCourses({
              search: {
                query: query.trim(),
                searchIn: ["name"],
              },
              count: 50,
              page: 0,
            });
          }}
          loading={coursesListState.loading}
          enterButton="Buscar"
          placeholder="Buscar cursos..."
        />
      </div>

      {/* Courses List */}
      {account && (
        <CoursesFeature.components.CoursesTable
          fetchCourses={fetchCourses}
          courses={courses}
          coursesListState={coursesListState}
          showDeleted={coursesListState.includeDeleted ?? false}
          onShowDeletedChange={(value) => {
            fetchCourses({
              includeDeleted: value,
            });
          }}
          onRestore={(course) => {
            modal.confirm({
              title: "Restaurar curso",
              content: `¿Estás seguro de que deseas restaurar el curso "${course.name}"?`,
              onOk: () => handleRestoreCourse(course.id),
            });
          }}
          onUpdate={(course) => {
            openUpdateCourseDrawer(course.id);
          }}
          onDelete={(course) => {
            modal.confirm({
              title: "Eliminar curso",
              content: `¿Estás seguro de que deseas eliminar el curso "${course.name}"?`,
              onOk: () => handleDeleteCourse(course.id),
            });
          }}
        />
      )}
    </RegistryLayout>
  );
}
