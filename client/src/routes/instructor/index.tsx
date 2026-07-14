import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Card, Col, Typography } from "antd";
const { Title, Paragraph } = Typography;

import {
  FaBook,
  FaPenAlt,
  FaList,
  FaHistory,
  FaFileAlt,
  FaClipboardList,
  FaPlus,
  FaUser,
} from "react-icons/fa";

import type { RootState } from "../../store";

import AuthFeature from "../../features/auth/";
import InstructorLayout from "../../layouts/Instructor";

export const Route = createFileRoute("/instructor/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const dispatch = useDispatch<typeof import("../../store").store.dispatch>();
  const { account } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!account) {
      (async () => {
        const result = await dispatch(AuthFeature.actions.fetch());
        if (AuthFeature.actions.fetch.rejected.match(result)) {
          navigate({ to: "/auth/login" });
        }
      })();
    }
  }, [account, dispatch, navigate]);

  const greeting =
    new Date().getHours() < 12
      ? "Buenos días"
      : new Date().getHours() < 18
        ? "Buenas tardes"
        : "Buenas noches";

  const menuItems = [
    {
      key: "my-courses",
      link: "/instructor/my-courses",
      label: "Mis Cursos",
      description: "Ver los cursos que tiene asignados",
      icon: <FaBook className="text-6xl" />,
    },
    {
      key: "record-grades",
      link: "/instructor/record-grades",
      label: "Registrar Notas",
      description: "Ingresar calificaciones de los estudiantes",
      icon: <FaPenAlt className="text-6xl" />,
    },
    {
      key: "class-roster",
      link: "/instructor/class-roster",
      label: "Lista de Clase",
      description: "Consultar la lista de estudiantes por curso",
      icon: <FaList className="text-6xl" />,
    },
    {
      key: "grade-history",
      link: "/instructor/grade-history",
      label: "Historial de Notas",
      description: "Revisar notas registradas anteriormente",
      icon: <FaHistory className="text-6xl" />,
    },
    {
      key: "course-detail",
      link: "/instructor/course-detail",
      label: "Rendimiento",
      description: "Reportes de rendimiento por curso",
      icon: <FaFileAlt className="text-6xl" />,
    },
    {
      key: "create-request",
      link: "/instructor/create-request",
      label: "Crear Solicitud",
      description: "Realizar una nueva solicitud académica",
      icon: <FaPlus className="text-6xl" />,
    },
    {
      key: "my-requests",
      link: "/instructor/my-requests",
      label: "Mis Solicitudes",
      description: "Seguimiento de sus solicitudes",
      icon: <FaClipboardList className="text-6xl" />,
    },
    {
      key: "profile",
      link: "/instructor/profile",
      label: "Perfil",
      description: "Ver su información de perfil",
      icon: <FaUser className="text-6xl" />,
    },
  ];

  return (
    <InstructorLayout>
      <div className="">
        <Title level={2} style={{ marginBottom: 24 }}>
          {greeting}, {account?.profile.name}
        </Title>
        <Paragraph>Panel de control del docente - Universidad de Las Américas</Paragraph>

        <div className="flex gap-2 flex-wrap mt-8 items-stretch justify-center">
          {menuItems.map((item) => (
            <Card
              hoverable
              className="w-1/4"
              key={item.key}
              onClick={() => {
                navigate({ to: item.link as any });
              }}
            >
              <div className="flex items-center flex-1 justify-center gap-4 h-full">
                <Col className="text-primary">{item.icon}</Col>
                <Col>
                  <p className="text-2xl font-bold text-primary">
                    {item.label}
                  </p>
                  {item.description && (
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {item.description}
                    </Paragraph>
                  )}
                </Col>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}
