import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import {
  App,
  Button,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  Space,
  Dropdown,
  Drawer,
} from "antd";
import {
  FaChalkboardTeacher,
  FaPlus,
  FaBook,
  FaTrashRestore,
  FaTrash,
  FaPencilAlt,
  FaEllipsisH,
  FaUserGraduate,
} from "react-icons/fa";
const { Title, Text } = Typography;

import RegistryLayout from "../../layouts/Registry";
import AccountsFeature from "../../features/accounts";
import CoursesFeature from "../../features/courses";
import courseInstructorApi from "../../features/course-instructor/api";

export const Route = createFileRoute("/registry/instructors")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  // ─── Instructor List ───
  const {
    accounts: instructors,
    accountsListState: instructorsListState,
    fetchAccounts: fetchInstructors,
  } = AccountsFeature.hooks.useAccountsList({});

  // ─── Update Instructor Modal ───
  const {
    state: updateInstructorState,
    setState: setUpdateInstructorState,
    openModal: openUpdateInstructorModal,
    update: handleUpdateInstructor,
    reset: closeUpdateInstructorModal,
  } = AccountsFeature.hooks.useUpdateModal({
    onSuccess: async () => {
      await fetchInstructors({
        count: 50,
        page: 0,
      });
    },
  });

  // ─── Delete / Restore ───
  const handleDeleteInstructor = async (accountId: string) => {
    const result = await AccountsFeature.api.delete({ accountId });
    if (result.status === "success") {
      message.success("Instructor eliminado exitosamente");
      fetchInstructors({ count: 50, page: 0, });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  const handleRestoreInstructor = async (accountId: string) => {
    const result = await AccountsFeature.api.restore({ accountId });
    if (result.status === "success") {
      message.success("Instructor restaurado exitosamente");
      fetchInstructors({ count: 50, page: 0, });
    } else {
      message.error(`Error: ${result.status}`);
    }
  };

  // ─── Assign Course Modal ───
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedInstructorName, setSelectedInstructorName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch all courses for the select
  const { courses, fetchCourses } = CoursesFeature.hooks.useCourseList({});

  const openAssignModal = useCallback(
    (instructorId: string, instructorName: string) => {
      setSelectedInstructorId(instructorId);
      setSelectedInstructorName(instructorName);
      setSelectedCourseId("");
      setAssignModalOpen(true);
      fetchCourses({ count: 200, page: 0 });
    },
    [fetchCourses],
  );

  const handleAssignCourse = useCallback(async () => {
    if (!selectedCourseId) {
      message.warning("Selecciona un curso");
      return;
    }
    setAssignLoading(true);
    const result = await courseInstructorApi.assign({
      courseId: selectedCourseId,
      accountId: selectedInstructorId,
    });
    setAssignLoading(false);
    if (result.status === "success") {
      message.success("Curso asignado exitosamente");
      setAssignModalOpen(false);
      setSelectedCourseId("");
    } else if (result.status === "already-assigned") {
      message.warning("El instructor ya está asignado a este curso");
    } else {
      message.error(`Error: ${result.status}`);
    }
  }, [selectedCourseId, selectedInstructorId, message]);

  // ─── Instructor Courses Drawer ───
  const [coursesDrawerOpen, setCoursesDrawerOpen] = useState(false);
  const [viewingInstructor, setViewingInstructor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);
  const [instructorCoursesLoading, setInstructorCoursesLoading] = useState(false);

  const openCoursesDrawer = useCallback(
    async (instructorId: string, instructorName: string) => {
      setViewingInstructor({ id: instructorId, name: instructorName });
      setCoursesDrawerOpen(true);
      setInstructorCoursesLoading(true);
      const result = await courseInstructorApi.listInstructor({
        accountId: instructorId,
      });
      setInstructorCoursesLoading(false);
      if (result.status === "success") {
        setInstructorCourses(result.courses ?? []);
      } else {
        message.error("Error al cargar los cursos del instructor");
        setInstructorCourses([]);
      }
    },
    [message],
  );

  const handleRemoveCourse = useCallback(
    async (courseId: string, courseName: string) => {
      if (!viewingInstructor) return;
      modal.confirm({
        title: "Remover curso",
        content: `¿Estás seguro de que deseas remover el curso "${courseName}" de ${viewingInstructor.name}?`,
        onOk: async () => {
          const result = await courseInstructorApi.remove({
            courseId,
            accountId: viewingInstructor.id,
          });
          if (result.status === "success") {
            message.success("Curso removido exitosamente");
            // Refresh the courses list
            const refreshResult = await courseInstructorApi.listInstructor({
              accountId: viewingInstructor.id,
            });
            if (refreshResult.status === "success") {
              setInstructorCourses(refreshResult.courses ?? []);
            }
          } else {
            message.error(`Error: ${result.status}`);
          }
        },
      });
    },
    [viewingInstructor, message, modal],
  );

  // ─── Initial Load ───
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
        });
      })();
    }
  }, [account]);

  return (
    <RegistryLayout selectedPage="registry-instructors">
      {/* ─── Update Instructor Modal ─── */}
      <AccountsFeature.components.UpdateModal
        state={updateInstructorState}
        setState={setUpdateInstructorState}
        onClose={closeUpdateInstructorModal}
        onUpdate={handleUpdateInstructor}
      />

      {/* ─── Assign Course Modal ─── */}
      <Modal
        title={`Asignar Curso a ${selectedInstructorName}`}
        open={assignModalOpen}
        onCancel={() => {
          setAssignModalOpen(false);
          setSelectedCourseId("");
        }}
        onOk={handleAssignCourse}
        okButtonProps={{
          loading: assignLoading,
          disabled: assignLoading || !selectedCourseId,
          icon: <FaPlus />,
        }}
        okText="Asignar Curso"
        cancelText="Cancelar"
      >
        <div className="mt-4">
          <Text strong>Instructor:</Text>
          <p>{selectedInstructorName}</p>
        </div>
        <div className="mt-2">
          <Text strong>Curso:</Text>
          <Select
            className="w-full mt-1"
            showSearch
            placeholder="Selecciona un curso"
            value={selectedCourseId || undefined}
            onChange={(val) => setSelectedCourseId(val)}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={(courses.courses ?? []).map((c: any) => ({
              label: `${c.code} - ${c.name}`,
              value: c.id,
            }))}
            notFoundContent="No hay cursos disponibles"
          />
        </div>
      </Modal>

      {/* ─── Instructor Courses Drawer ─── */}
      <Drawer
        title={
          viewingInstructor
            ? `Cursos de ${viewingInstructor.name}`
            : "Cursos del Instructor"
        }
        open={coursesDrawerOpen}
        onClose={() => {
          setCoursesDrawerOpen(false);
          setViewingInstructor(null);
          setInstructorCourses([]);
        }}
        width={600}
      >
        <Table
          dataSource={instructorCourses}
          rowKey="id"
          loading={instructorCoursesLoading}
          columns={[
            {
              title: "Código",
              key: "code",
              dataIndex: "code",
              width: 100,
            },
            {
              title: "Nombre",
              key: "name",
              dataIndex: "name",
            },
            {
              title: "Créditos",
              key: "credits",
              dataIndex: "credits",
              width: 80,
            },
            {
              title: "Estado",
              key: "status",
              width: 100,
              render: (_: any, record: any) => (
                <Tag color={record.metadata?.deleted ? "red" : "green"}>
                  {record.metadata?.deleted ? "Inactivo" : "Activo"}
                </Tag>
              ),
            },
            {
              title: "Acciones",
              key: "actions",
              fixed: "right",
              width: 120,
              render: (_: any, record: any) => (
                <Button
                  danger
                  size="small"
                  icon={<FaTrash />}
                  disabled={record.metadata?.deleted}
                  onClick={() => handleRemoveCourse(record.id, record.name)}
                >
                  Remover
                </Button>
              ),
            },
          ]}
          pagination={false}
          locale={{ emptyText: "No tiene cursos asignados" }}
        />
      </Drawer>

      {/* ─── Page Content ─── */}
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

      <Text>Gestiona los instructores registrados y asigna cursos académicos.</Text>

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
            fetchInstructors({
              ...params,
              filters: { ...params?.filters },
            })
          }
          // Override the default columns to add extra actions
          onUpdate={(acc) => {
            openUpdateInstructorModal(acc.id);
          }}
          onChangePassword={() => { }}
          onUpdateStatus={() => { }}
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
          // Wrap the table with extra action column
          extraActions={(record: any) => (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<FaBook />}
                onClick={(e) => {
                  e.stopPropagation();
                  openAssignModal(record.id, record.name);
                }}
              >
                Asignar Curso
              </Button>
              <Button
                size="small"
                icon={<FaUserGraduate />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCoursesDrawer(record.id, record.name);
                }}
              >
                Cursos
              </Button>
            </Space>
          )}
        />
      )}
    </RegistryLayout>
  );
}
