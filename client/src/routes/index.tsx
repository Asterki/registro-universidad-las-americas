import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";

import {
  ConfigProvider,
  Layout,
  Space,
  Typography,
  Card,
  Button,
} from "antd";
const { Header, Footer, Content } = Layout;
const { Title, Paragraph } = Typography;
import esES from "antd/locale/es_ES";

import {
  FaUniversity,
  FaChalkboardTeacher,
  FaUsers,
  FaClipboardList,
  FaArrowRight,
} from "react-icons/fa";

import AuthFeature from "../features/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const PORTAL_OPTIONS = [
  {
    key: "admin",
    title: "Panel de Administración",
    description: "Gestión completa del sistema — cuentas, roles, campus, facultades, períodos y cursos.",
    icon: <FaUniversity className="text-5xl text-blue-500" />,
    color: "blue",
    href: "/admin",
  },
  {
    key: "registry",
    title: "Registro Académico",
    description: "Gestión de solicitudes, instructores y estudiantes del registro académico.",
    icon: <FaClipboardList className="text-5xl text-emerald-500" />,
    color: "emerald",
    href: "/registry",
  },
  {
    key: "instructor",
    title: "Portal del Instructor",
    description: "Consulta tus cursos, registra calificaciones y gestiona tu perfil docente.",
    icon: <FaChalkboardTeacher className="text-5xl text-amber-500" />,
    color: "amber",
    href: "/instructor",
  },
  {
    key: "student",
    title: "Portal del Estudiante",
    description: "Inscríbete a cursos, consulta tus calificaciones y envía solicitudes académicas.",
    icon: <FaUsers className="text-5xl text-purple-500" />,
    color: "purple",
    href: "/student",
  },
];

function LandingPage() {
  const dispatch = useDispatch<typeof import("../store").store.dispatch>();
  const { account } = useSelector((state: RootState) => state.auth);

  // Fetch auth silently — if already logged in, account will be set
  useEffect(() => {
    if (!account) {
      dispatch(AuthFeature.actions.fetch());
    }
  }, [account, dispatch]);

  const handleSelect = (href: string) => {
    if (account) {
      navigate({ to: href as any });
    } else {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(href)}`;
    }
  };

  return (
    <ConfigProvider locale={esES}>
      <Layout className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Header */}
        <Header className="flex items-center justify-between px-6 bg-transparent border-b border-white/10">
          <Space align="center" size={14}>
            <img
              src="/assets/img/icon.png"
              alt="Logo"
              className="w-10 h-10 rounded-full object-contain"
            />
            <Title level={4} className="!mb-0 text-white !m-0">
              Universidad de Las Américas
            </Title>
          </Space>
        </Header>

        {/* Hero */}
        <Content className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center max-w-3xl mb-16">
            <div className="mb-6">
              <img
                src="/assets/img/icon.png"
                alt="Logo"
                className="w-24 h-24 mx-auto rounded-full object-contain shadow-lg shadow-blue-500/20"
              />
            </div>
            <Title className="!text-primary !mb-3 !text-4xl md:!text-5xl !font-bold">
              Sistema de Registro Universitario
            </Title>
            <Paragraph className="!text-slate-9000 !text-lg !mb-2">
              Bienvenido al sistema de registro de la Universidad de las Américas.
            </Paragraph>
            <Paragraph className="!text-slate-700 !text-sm">
              Selecciona el portal al que deseas acceder.
            </Paragraph>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full px-4">
            {PORTAL_OPTIONS.map((option) => (
              <div
                key={option.key}
                className="cursor-pointer"
                onClick={() => {
                  if (account) {
                    window.location.href = option.href;
                  } else {
                    window.location.href = `/auth/login?redirect=${encodeURIComponent(option.href)}`;
                  }
                }}
              >
                <Card
                  hoverable
                  className="!bg-white/5 !border-white/10 !backdrop-blur-sm group transition-all duration-300 hover:!border-blue-400/50 hover:!shadow-lg hover:!shadow-blue-500/10"
                >
                  <div className="flex flex-col items-center text-center gap-4 py-4">
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      {option.icon}
                    </div>
                    <div>
                      <Title level={4} className="!text-slate-500 !mb-2">
                        {option.title}
                      </Title>
                      <Paragraph className="!text-slate-400 !text-sm !mb-0">
                        {option.description}
                      </Paragraph>
                    </div>
                    <Button
                      type="text"
                      className="!text-slate-800/60 group-hover:!text-blue-600 transition-colors mt-2"
                      icon={<FaArrowRight />}
                    >
                      Acceder
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Content>

        {/* Footer */}
        <Footer className="text-center bg-transparent border-t border-white/10 !text-slate-500 !text-sm">
          Hecho por{" "}
          <a
            href="https://asterki.xyz"
            target="_blank"
            className="underline text-slate-400 hover:text-white transition-colors"
          >
            Grupo #4 - Estructuras de Datos
          </a>{" "}
          | {new Date().getFullYear()}
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
