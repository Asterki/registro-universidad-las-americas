import { Form, Select, Button, Card, Typography } from "antd";
const { Title, Text } = Typography;

import { Course } from "@prisma/client";
import { useState } from "react";

type EnrollSelfFormProps = {
  periods: { id: string; name: string }[];
  courses: any[]; // Replace 'any' with the actual course type if available
  onEnroll: (data: { courseId: string }) => Promise<any>;
  loading: boolean;
};

export function EnrollSelfForm({
  periods,
  courses,
  onEnroll,
  loading,
}: EnrollSelfFormProps) {
  const [form] = Form.useForm();

  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  const handleFinish = async (values: { courseId: string }) => {
    await onEnroll(values);
  };

  console.log(courses);

  return (
    <div className="flex items-stretch flex-1 justify-center gap-2">
      <Card className="mx-auto w-1/2">
        <Title level={4}>Seleccionar Facultad del Curso</Title>
        <Text type="secondary">
          Selecciona la facultad a la que pertenece el curso en el que deseas
        </Text>

        <Select
          placeholder="Selecciona una facultad"
          onChange={(value) => setSelectedFaculty(value)}
          className="mt-4 w-full"
          options={Array.from(new Set(courses.map((course) => course.facultyId))).map(
            (facultyId) => ({
              value: facultyId,
              label: courses.find((course) => course.facultyId === facultyId)!.faculty!.name || facultyId,
            }),
          )}

        />
      </Card>

      {selectedFaculty && (
        <Card className="w-1/2">
          <Title level={4}>Matricularse en un Curso</Title>
          <Text type="secondary">
            Selecciona el período y el curso al que deseas matricularte.
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            className="mt-4"
          >
            <Form.Item
              name="courseId"
              label="Curso"
              rules={[{ required: true, message: "Selecciona un curso" }]}
            >
              <Select
                placeholder="Selecciona un curso"
                showSearch
                optionFilterProp="children"
              >
                {courses
                  .filter((course) => course.facultyId === selectedFaculty)
                  .map((course) => (
                    <Select.Option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Matricularse
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
}
