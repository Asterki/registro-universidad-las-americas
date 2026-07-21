import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Card, Col, Typography } from "antd";
const { Title, Paragraph } = Typography;

import {
  FaClipboardList,
  FaChalkboardTeacher,
  FaUsers,
} from "react-icons/fa";

import type { RootState } from "../../store";

import AuthFeature from "../../features/auth/";
import RegistryLayout from "../../layouts/Registry";

export const Route = createFileRoute("/registry/")({
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
          navigate({ to: "/auth/login", search: { redirect: window.location.pathname } });
        }
      })();
    }
  }, [account, dispatch, navigate]);

  const menuItems: Array<{
    key: string;
    link: string;
    label: string;
    description?: string;
    style?: React.CSSProperties;
    icon: React.ReactNode;
  }> = [
      {
        key: "requests",
        link: "/registry/requests",
        label: "Solicitudes",
        description: "Gestionar solicitudes académicas",
        style: {
          display:
            account?.data.role.permissions.includes("registry:list-requests") ||
              account?.data.role.permissions.includes("*")
              ? "block"
              : "none",
        },
        icon: <FaClipboardList className="text-6xl" />,
      },
      {
        key: "instructors",
        link: "/registry/instructors",
        label: "Instructores",
        description: "Gestionar instructores registrados",
        style: {
          display:
            account?.data.role.permissions.includes("registry:list-instructors") ||
              account?.data.role.permissions.includes("*")
              ? "block"
              : "none",
        },
        icon: <FaChalkboardTeacher className="text-6xl" />,
      },
      {
        key: "students",
        link: "/registry/students",
        label: "Estudiantes",
        description: "Gestionar estudiantes registrados",
        style: {
          display: account?.data.role.permissions.includes("*")
            ? "block"
            : "none",
        },
        icon: <FaUsers className="text-6xl" />,
      },
    ];

  const greeting =
    new Date().getHours() < 12
      ? "Buenos días"
      : new Date().getHours() < 18
        ? "Buenas tardes"
        : "Buenas noches";

  return (
    <RegistryLayout>
      <div className="">
        <Title level={2} style={{ marginBottom: 24 }}>
          {greeting}, {account?.profile.name}
        </Title>
        <p className="text-blue-600">Panel de Registro Académico — gestión de solicitudes, instructores y estudiantes.</p>

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
                <Col className="text-blue-600">{item.icon}</Col>
                <Col>
                  <p className="text-2xl font-bold text-blue-600">
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
    </RegistryLayout>
  );
}
