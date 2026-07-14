import { Form, Select, Input, Button, Card, Typography } from "antd";
const { Title, Text } = Typography;
const { TextArea } = Input;

type CreateRequestFormProps = {
  faculties: { id: string; name: string }[];
  onCreate: (data: {
    type: string;
    description: string;
    facultyId?: string;
  }) => Promise<any>;
  loading: boolean;
};

export function CreateRequestForm({
  faculties,
  onCreate,
  loading,
}: CreateRequestFormProps) {
  const [form] = Form.useForm();

  const handleFinish = async (values: {
    type: string;
    description: string;
    facultyId?: string;
  }) => {
    await onCreate(values);
    form.resetFields();
  };

  const requestTypes = [
    { value: "academic_certificate", label: "Certificado Académico" },
    { value: "study_load", label: "Carga de Estudios" },
    { value: "subject_equivalence", label: "Equivalencia de Materias" },
    { value: "schedule_change", label: "Cambio de Horario" },
    { value: "special_permission", label: "Permiso Especial" },
    { value: "others", label: "Otros" },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <Title level={4}>Crear Solicitud</Title>
      <Text type="secondary">
        Completa el formulario para crear una nueva solicitud.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Form.Item
          name="type"
          label="Tipo de Solicitud"
          rules={[
            { required: true, message: "Selecciona un tipo de solicitud" },
          ]}
        >
          <Select placeholder="Selecciona el tipo de solicitud">
            {requestTypes.map((type) => (
              <Select.Option key={type.value} value={type.value}>
                {type.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="facultyId"
          label="Facultad (opcional)"
        >
          <Select placeholder="Selecciona una facultad" allowClear>
            {faculties.map((faculty) => (
              <Select.Option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Descripción"
          rules={[
            { required: true, message: "Describe tu solicitud" },
            {
              min: 10,
              message: "La descripción debe tener al menos 10 caracteres",
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Describe el motivo de tu solicitud..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Enviar Solicitud
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
