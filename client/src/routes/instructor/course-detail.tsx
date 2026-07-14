import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Typography, Select, Card, Space, Statistic, Row, Col, Table, Tag } from "antd";
const { Title, Text } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import CoursesFeature from "../../features/courses";
import { useCourseRoster } from "../../features/courses/hooks/useCourseRoster";
import { useCourseGrades } from "../../features/grades/hooks/useCourseGrades";

export const Route = createFileRoute("/instructor/course-detail")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { students, loading: rosterLoading, fetchRoster } = useCourseRoster();
  const { grades, loading: gradesLoading, fetchGrades } = useCourseGrades();
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
      fetchGrades(selectedCourse);
    }
  }, [selectedCourse, fetchRoster, fetchGrades]);

  const averageScore = grades.length > 0
    ? (grades.reduce((sum: number, g: any) => sum + (g.score ?? 0), 0) / grades.length).toFixed(1)
    : "0";

  const passedCount = grades.filter((g: any) => g.score >= 70).length;
  const failedCount = grades.filter((g: any) => g.score < 70).length;

  return (
    <InstructorLayout selectedPage="course-detail">
      <Title level={3}>Rendimiento del Curso</Title>
      <p className="text-gray-500 mb-4">
        Reporte detallado del rendimiento académico por curso.
      </p>

      <Card className="mb-4">
        <Space direction="vertical" className="w-full">
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
        </Space>
      </Card>

      {selectedCourse && (
        <>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="Total Estudiantes" value={students.length} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic title="Promedio General" value={averageScore} suffix="/ 100" />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Aprobados / Reprobados"
                  value={`${passedCount} / ${failedCount}`}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Estudiantes Inscritos" className="mb-4">
            <Table
              dataSource={students}
              rowKey={(record: any) => record.id ?? record._id ?? ""}
              loading={rosterLoading}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "#",
                  key: "index",
                  width: 40,
                  render: (_: any, __: any, i: number) => i + 1,
                },
                {
                  title: "Código",
                  key: "code",
                  render: (_: any, record: any) =>
                    record.student?.code ?? record.code ?? "-",
                },
                {
                  title: "Nombre",
                  key: "name",
                  render: (_: any, record: any) => {
                    const p = record.student?.profile ?? record.profile ?? {};
                    return `${p.name ?? ""} ${p.lastName ?? ""}`;
                  },
                },
                {
                  title: "Estado",
                  key: "status",
                  dataIndex: "status",
                  width: 100,
                  render: (status: string) => (
                    <Tag color={status === "active" ? "green" : "default"}>
                      {status === "active" ? "Activo" : status}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Calificaciones">
            <Table
              dataSource={grades}
              rowKey={(record: any) => record.id ?? record._id ?? ""}
              loading={gradesLoading}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "#",
                  key: "index",
                  width: 40,
                  render: (_: any, __: any, i: number) => i + 1,
                },
                {
                  title: "Estudiante",
                  key: "student",
                  render: (_: any, record: any) => record.studentName ?? "-",
                },
                {
                  title: "Tipo",
                  key: "type",
                  dataIndex: "type",
                  width: 120,
                },
                {
                  title: "Nota",
                  key: "score",
                  dataIndex: "score",
                  width: 80,
                  render: (score: number) => (
                    <Tag color={score >= 70 ? "green" : "red"}>{score}</Tag>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}

      {!selectedCourse && (
        <Card>
          <p className="text-gray-400 text-center py-8">
            Seleccione un curso para ver su rendimiento
          </p>
        </Card>
      )}
    </InstructorLayout>
  );
}
