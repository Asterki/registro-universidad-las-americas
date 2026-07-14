import { Form, Select, Button, Card, Typography } from "antd";
const { Title, Text } = Typography;

type EnrollSelfFormProps = {
  periods: { id: string; name: string }[];
  courses: { id: string; name: string; code: string }[];
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

  const handleFinish = async (values: { courseId: string }) => {
    await onEnroll(values);
  };

  return (
    <Card className="max-w-2xl mx-auto">
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
            {courses.map((course) => (
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
  );
}
