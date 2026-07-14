import { Table, Card, Statistic, Row, Col, Typography, Descriptions } from "antd";
const { Title, Text } = Typography;

type TranscriptViewProps = {
  history: any[];
  summary: {
    totalCredits?: number;
    gpa?: number;
    completedCourses?: number;
  } | null;
  loading: boolean;
};

export function TranscriptView({
  history,
  summary,
  loading,
}: TranscriptViewProps) {
  return (
    <div className="mt-4">
      {summary && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total de Créditos"
                value={summary.totalCredits || 0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Promedio General (GPA)"
                value={summary.gpa ? summary.gpa.toFixed(2) : "N/A"}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Cursos Completados"
                value={summary.completedCourses || 0}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Title level={4}>Historial Académico</Title>

      <Table
        className="w-full overflow-x-scroll"
        dataSource={history}
        columns={[
          {
            title: "Curso",
            key: "course",
            render: (_: any, record: any) => (
              <span>
                {record.course?.code} - {record.course?.name}
              </span>
            ),
          },
          {
            title: "Período",
            key: "period",
            render: (_: any, record: any) =>
              record.period?.name || record.enrollment?.period?.name || "-",
          },
          {
            title: "Créditos",
            key: "credits",
            render: (_: any, record: any) =>
              record.course?.credits ?? record.credits ?? "-",
          },
          {
            title: "Nota",
            key: "grade",
            render: (_: any, record: any) => {
              const value = record.grade?.value ?? record.value;
              const letter = record.grade?.letter ?? record.letter;
              return (
                <span>
                  {letter || (value !== null && value !== undefined ? value.toFixed(2) : "N/A")}
                </span>
              );
            },
          },
          {
            title: "Estado",
            key: "status",
            dataIndex: "status",
            render: (status: string) => {
              const labels: Record<string, string> = {
                completed: "Aprobado",
                failed: "Reprobado",
                active: "En curso",
                cancelled: "Cancelado",
              };
              return <Text>{labels[status] || status || "-"}</Text>;
            },
          },
        ]}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} de ${total} registros`,
          showSizeChanger: true,
        }}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: "No hay registros en tu historial académico.",
        }}
      />
    </div>
  );
}
