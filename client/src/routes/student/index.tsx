import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Card, Col, Typography } from "antd";
const { Title, Paragraph } = Typography;

import StudentLayout from "../../layouts/Student";

import {
  FaClipboardList,
  FaListAlt,
  FaStar,
  FaGraduationCap,
  FaBook,
  FaFileAlt,
  FaUser,
  FaCompressArrowsAlt,
} from "react-icons/fa";

export const Route = createFileRoute("/student/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { account } = useSelector((state: RootState) => state.auth);

  const greeting =
    new Date().getHours() < 12
      ? "Buenos días"
      : new Date().getHours() < 18
        ? "Buenas tardes"
        : "Buenas noches";

  const menuItems: Array<{
    key: string;
    link: string;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "enrollment",
      link: "/student/enrollment",
      label: "Matricularse",
      description: "Inscríbete en cursos disponibles para el período actual.",
      icon: <FaClipboardList className="text-6xl" />,
    },
    {
      key: "my-enrollments",
      link: "/student/my-enrollments",
      label: "Mis Matrículas",
      description: "Consulta y gestiona tus matrículas activas.",
      icon: <FaListAlt className="text-6xl" />,
    },
    {
      key: "my-grades",
      link: "/student/my-grades",
      label: "Mis Notas",
      description: "Revisa las calificaciones de tus cursos.",
      icon: <FaStar className="text-6xl" />,
    },
    {
      key: "academic-history",
      link: "/student/academic-history",
      label: "Historial Académico",
      description: "Consulta tu expediente académico completo.",
      icon: <FaGraduationCap className="text-6xl" />,
    },
    {
      key: "available-courses",
      link: "/student/available-courses",
      label: "Cursos Disponibles",
      description: "Explora la oferta académica disponible.",
      icon: <FaBook className="text-6xl" />,
    },
    {
      key: "create-request",
      link: "/student/create-request",
      label: "Crear Solicitud",
      description: "Realiza solicitudes académicas y administrativas.",
      icon: <FaFileAlt className="text-6xl" />,
    },
    {
      key: "profile",
      link: "/student/profile",
      label: "Perfil",
      description: "Visualiza y administra tu información personal.",
      icon: <FaUser className="text-6xl" />,
    },
  ];

  return (
    <StudentLayout>
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>
          {greeting}, {account?.profile?.name}
        </Title>
        <Paragraph>
          Bienvenido al Portal del Estudiante. Aquí puedes gestionar tu
          matrícula, consultar notas, revisar tu historial académico y realizar
          solicitudes.
        </Paragraph>

        <div className="flex gap-4 flex-wrap mt-8 items-stretch justify-center">
          {menuItems.map((item) => (
            <Card
              hoverable
              className="w-1/4 min-w-[280px]"
              key={item.key}
              onClick={() => {
                navigate({ to: item.link as any });
              }}
            >
              <div className="flex items-center flex-1 justify-center gap-4 h-full">
                <Col>{item.icon}</Col>
                <Col>
                  <p className="text-2xl font-bold">{item.label}</p>
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    {item.description}
                  </Paragraph>
                </Col>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
