import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Typography, Select, Card, Space } from "antd";
const { Title, Text } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import CoursesFeature from "../../features/courses";
import { CourseRosterTable } from "../../features/courses/components/CourseRosterTable";

export const Route = createFileRoute("/instructor/class-roster")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { students, loading, fetchRoster } = CoursesFeature.hooks.useCourseRoster();
  const { courses, fetchCourses } = CoursesFeature.hooks.useInstructorCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();

  useEffect(() => {
    if (account) {
      fetchCourses();
    }
  }, [account, fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchRoster(selectedCourse);
    }
  }, [selectedCourse, fetchRoster]);

  return (
    <InstructorLayout selectedPage="class-roster">
      <Title level={3}>Lista de Clase</Title>
      <p className="text-gray-500 mb-4">
        Seleccione un curso para ver la lista de estudiantes inscritos.
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
            <CourseRosterTable students={students} loading={loading} />
          )}

          {!selectedCourse && (
            <p className="text-gray-400 text-center py-8">
              Seleccione un curso para ver su lista de clase
            </p>
          )}
        </Space>
      </Card>
    </InstructorLayout>
  );
}
