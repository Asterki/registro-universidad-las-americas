import { Form, InputNumber, Input, Button, Select, Card, Space, Typography } from "antd";
const { TextArea } = Input;
const { Title, Text } = Typography;

export type GradeRecordFormValues = {
  enrollmentId: string;
  score: number;
  description?: string;
  type: string;
};

type GradeRecordFormProps = {
  students: any[];
  courseName: string;
  onSubmit: (values: GradeRecordFormValues[]) => Promise<void>;
  submitting: boolean;
};

export function GradeRecordForm({ students, courseName, onSubmit, submitting }: GradeRecordFormProps) {
  const [form] = Form.useForm();
  const gradeTypes = ["Parcial 1", "Parcial 2", "Parcial 3", "Final", "Extraordinario"];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const records = students.map((student) => ({
        enrollmentId: student.id ?? student._id ?? student.enrollmentId ?? "",
        score: Number(values[`score_${student.id ?? student._id ?? student.enrollmentId}`] ?? 0),
        description: values[`desc_${student.id ?? student._id ?? student.enrollmentId}`] ?? "",
        type: values.gradeType,
      }));
      await onSubmit(records);
    } catch {
      // validation failed
    }
  };

  return (
    <Card title={<Title level={4}>{courseName}</Title>}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="gradeType"
          label="Tipo de Nota"
          rules={[{ required: true, message: "Seleccione el tipo de nota" }]}
        >
          <Select placeholder="Seleccione el tipo de nota">
            {gradeTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="space-y-2">
          {students.map((student) => {
            const profile = student.student?.profile ?? student.profile ?? {};
            const name = profile.name ?? student.name ?? "";
            const lastName = profile.lastName ?? student.lastName ?? "";
            const code = student.student?.code ?? student.code ?? "";
            const key = student.id ?? student._id ?? student.enrollmentId ?? Math.random().toString();

            return (
              <Card key={key} size="small" className="mb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-[200px]">
                    <Text strong>
                      {name} {lastName}
                    </Text>
                    <br />
                    <Text type="secondary">{code}</Text>
                  </div>
                  <Space className="flex-1">
                    <Form.Item
                      name={`score_${key}`}
                      label="Nota"
                      rules={[
                        { required: true, message: "Ingrese la nota" },
                        { type: "number", min: 0, max: 100, message: "0-100" },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={100} style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item name={`desc_${key}`} label="Descripción" style={{ marginBottom: 0, flex: 1 }}>
                      <TextArea rows={1} placeholder="Opcional" />
                    </Form.Item>
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-4">
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            Guardar Notas
          </Button>
        </div>
      </Form>
    </Card>
  );
}
