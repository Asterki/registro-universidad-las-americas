import { Card, Descriptions, Avatar, Typography, Spin, Tag } from "antd";
import { FaUser } from "react-icons/fa";
const { Title, Text } = Typography;

type ProfileViewProps = {
  profile: any;
  loading: boolean;
};

export function ProfileView({ profile, loading }: ProfileViewProps) {
  if (loading) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <Text type="secondary">No se pudo cargar la información del perfil.</Text>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Card className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Avatar size={64} icon={<FaUser />} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {profile.profile?.name || profile.name || "Sin nombre"}
            </Title>
            <Text type="secondary">
              {profile.email?.value || profile.email || "Sin correo"}
            </Text>
          </div>
        </div>

        <Descriptions
          title="Información General"
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item label="Nombre">
            {profile.profile?.name || profile.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Correo Electrónico">
            {profile.email?.value || profile.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={profile.data?.status === "active" ? "green" : "red"}>
              {profile.data?.status === "active" ? "Activo" : "Inactivo"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Rol">
            {profile.data?.role?.name || profile.role?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Teléfono">
            {profile.profile?.phone || profile.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Dirección">
            {profile.profile?.address || profile.address || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
