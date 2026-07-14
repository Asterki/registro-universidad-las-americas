import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Typography, Select, Space, Card, App } from "antd";
const { Title, Text } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import CoursesFeature from "../../features/courses";
import { useCourseRoster } from "../../features/courses/hooks/useCourseRoster";
import { useRecordGrade } from "../../features/grades/hooks/useRecordGrade";
import { GradeRecordForm } from "../../features/grades/components/GradeRecordForm";

export const Route = createFileRoute("/instructor/record-grades")({
  component: RouteComponent,
});

function RouteComponent() {
  const { message } = App.useApp();
  const { account } = useSelector((state: RootState) => state.auth);
  const { students, loading: rosterLoading, fetchRoster } = useCourseRoster();
  const { courses, fetchCourses } = CoursesFeature.hooks.useInstructorCourses();
  const { bulkRecord, submitting } = useRecordGrade();

  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | undefined>();

  useEffect(() => {
    if (account) {
      fetchCourses();
    }
  }, [account, fetchCourses]);

  useEffect(() => {
    if (selectedCourse?.id) {
      fetchRoster(selectedCourse.id);
    }
  }, [selectedCourse?.id, fetchRoster]);

  const handleSubmitGrades = async (grades: { enrollmentId: string; score: number; description?: string; type: string }[]) => {
    const success = await bulkRecord(grades);
    if (success) {
      message.success("Notas registradas exitosamente");
      if (selectedCourse) fetchRoster(selectedCourse.id);
    } else {
      message.error("Error al registrar las notas");
    }
  };

  return (
    <InstructorLayout selectedPage="record-grades">
      <Title level={3}>Registrar Notas</Title>
      <p className="text-gray-500 mb-4">
        Seleccione un curso y registre las calificaciones de los estudiantes.
      </p>

      <Card className="mb-4">
        <Space direction="vertical" className="w-full">
          <div>
            <Text strong>Seleccionar Curso</Text>
            <Select
              className="w-full max-w-md ml-2"
              placeholder="Seleccione un curso..."
              value={selectedCourse?.id}
              onChange={(id) => {
                const course = courses.find((c: any) => c.id === id);
                setSelectedCourse(course ? { id: course.id, name: `${course.code} - ${course.name}` } : undefined);
              }}
              options={courses.map((c: any) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
              }))}
            />
          </div>
        </Space>
      </Card>

      {selectedCourse && students.length > 0 && (
        <GradeRecordForm
          students={students}
          courseName={selectedCourse.name}
          onSubmit={handleSubmitGrades}
          submitting={submitting}
        />
      )}

      {selectedCourse && students.length === 0 && !rosterLoading && (
        <Card>
          <p className="text-gray-400 text-center py-4">
            No hay estudiantes inscritos en este curso.
          </p>
        </Card>
      )}

      {!selectedCourse && (
        <Card>
          <p className="text-gray-400 text-center py-8">
            Seleccione un curso para comenzar a registrar notas
          </p>
        </Card>
      )}
    </InstructorLayout>
  );
}
