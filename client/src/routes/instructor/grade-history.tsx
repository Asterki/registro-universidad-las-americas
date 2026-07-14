import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Typography, Select, Card, Space } from "antd";
const { Title, Text } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import CoursesFeature from "../../features/courses";
import { useCourseGrades } from "../../features/grades/hooks/useCourseGrades";
import { CourseGradesTable } from "../../features/grades/components/CourseGradesTable";

export const Route = createFileRoute("/instructor/grade-history")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { grades, loading, fetchGrades } = useCourseGrades();
  const { courses, fetchCourses } = CoursesFeature.hooks.useInstructorCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();

  useEffect(() => {
    if (account) {
      fetchCourses();
    }
  }, [account, fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchGrades(selectedCourse);
    }
  }, [selectedCourse, fetchGrades]);

  return (
    <InstructorLayout selectedPage="grade-history">
      <Title level={3}>Historial de Notas</Title>
      <p className="text-gray-500 mb-4">
        Consulte las notas registradas anteriormente por curso.
      </p>

      <Card>
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong>Seleccionar Curso</Text>
            <Select
              className="w-full max-w-md ml-2"
              placeholder="Seleccione un curso..."
              value={selectedCourse}
              onChange={setSelectedCourse}
              options={courses.map((c: any) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
              }))}
            />
          </div>

          {selectedCourse && (
            <CourseGradesTable grades={grades} loading={loading} />
          )}

          {!selectedCourse && (
            <p className="text-gray-400 text-center py-8">
              Seleccione un curso para ver su historial de notas
            </p>
          )}
        </Space>
      </Card>
    </InstructorLayout>
  );
}
