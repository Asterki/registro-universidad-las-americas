import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  FaBars,
  FaCompressArrowsAlt,
  FaBook,
  FaStar,
  FaGraduationCap,
  FaFileAlt,
  FaUser,
  FaRegArrowAltCircleLeft,
  FaClipboardList,
} from "react-icons/fa";

import {
  ConfigProvider,
  Drawer,
  Layout,
  Menu,
  MenuProps,
  Space,
  Spin,
  Typography,
} from "antd";
const { Title } = Typography;
import esES from "antd/locale/es_ES";

import { useDispatch, useSelector } from "react-redux";

import AuthFeature from "../features/auth/";
import type { RootState } from "../store";

const { Header, Sider } = Layout;

interface LayoutProps {
  children: React.ReactNode;
  selectedPage?: string;
  defaultCollapsed?: boolean;
  removePadding?: boolean;
}

export default function PageLayout({
  children,
  selectedPage,
  removePadding,
  defaultCollapsed,
}: LayoutProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<typeof import("../store").store.dispatch>();

  const { account } = useSelector((state: RootState) => state.auth);

  const [collapsed, setCollapsed] = useState(defaultCollapsed || false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (!account) {
      (async () => {
        const result = await dispatch(AuthFeature.actions.fetch());

        if (
          AuthFeature.actions.fetch.rejected.match(result) ||
          result.payload.status === "unauthenticated"
        ) {
          navigate({ to: "/auth/login", search: { redirect: window.location.pathname } });
        } else {
          console.log("Account fetched successfully:", result.payload);
        }
      })();
    }
  }, [account]);

  const sidebarRef = useRef(null);

  type MenuItem = Required<MenuProps>["items"][number];
  const menuItems = useMemo<MenuItem[]>(() => {
    if (!account) return [];

    return [
      {
        key: "dashboard",
        label: <Link to="/student">Dashboard</Link>,
        icon: <FaCompressArrowsAlt />,
      },
      {
        key: "matricula",
        label: "Matrícula",
        icon: <FaClipboardList />,
        children: [
          {
            key: "enrollment",
            label: <Link to="/student/enrollment">Matricularse</Link>,
          },
          {
            key: "my-enrollments",
            label: <Link to="/student/my-enrollments">Mis Matrículas</Link>,
          },
        ],
      },
      {
        key: "notas",
        label: "Notas",
        icon: <FaStar />,
        children: [
          {
            key: "my-grades",
            label: <Link to="/student/my-grades">Mis Notas</Link>,
          },
          {
            key: "academic-history",
            label: (
              <Link to="/student/academic-history">Historial Académico</Link>
            ),
          },
        ],
      },
      {
        key: "cursos",
        label: "Cursos",
        icon: <FaBook />,
        children: [
          {
            key: "available-courses",
            label: (
              <Link to="/student/available-courses">Cursos Disponibles</Link>
            ),
          },

        ],
      },
      {
        key: "solicitudes",
        label: "Solicitudes",
        icon: <FaFileAlt />,
        children: [
          {
            key: "create-request",
            label: <Link to="/student/create-request">Crear Solicitud</Link>,
          },
          {
            key: "my-requests",
            label: <Link to="/student/my-requests">Mis Solicitudes</Link>,
          },
        ],
      },
      {
        key: "profile",
        label: <Link to="/student/profile">Perfil</Link>,
        icon: <FaUser />,
      },
      {
        key: "logout",
        label: <Link to="/auth/logout">Cerrar Sesión</Link>,
        danger: true,
        icon: <FaRegArrowAltCircleLeft className="text-red-300" />,
      },
    ];
  }, [account]);

  const isDark = false;

  return (
    <ConfigProvider locale={esES}>
      {/* Top Navbar */}
      <Header
        className={`px-4 flex items-center justify-between color-white`}
        style={{ paddingInline: 16 }}
      >
        <div className="md:hidden block">
          <button
            onClick={() => setDrawerVisible(true)}
            className="md:hidden text-xl block text-white"
          >
            <FaBars />
          </button>
        </div>
        <Space align="center" className="" size={14}>
          <img
            src="/assets/img/icon.png"
            alt="Icon"
            style={{ width: 42, height: 42, objectFit: "contain" }}
            className="rounded-full"
          />
          <div className="text-white">
            <h1 style={{ margin: 0 }} className="text-white font-bold text-lg">
              Portal del Estudiante | Universidad de Las Américas
            </h1>
          </div>
        </Space>
      </Header>

      <Layout hasSider>
        {/* Sidebar for desktop */}
        <Sider
          breakpoint="md"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          className="hidden md:block"
          theme={isDark ? "dark" : "light"}
          width={220}
          ref={sidebarRef}
        >
          <Menu
            mode="inline"
            defaultOpenKeys={["matricula", "notas", "cursos", "solicitudes"]}
            defaultSelectedKeys={[selectedPage || "dashboard"]}
            items={menuItems}
            className="h-full"
          />
        </Sider>

        {/* Sidebar Drawer for mobile */}
        <Drawer
          title="Menú"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={[selectedPage || "dashboard"]}
            defaultOpenKeys={["matricula", "notas", "cursos", "solicitudes"]}
            style={{
              color: "white",
            }}
            items={menuItems}
            onClick={() => setDrawerVisible(false)}
          />
        </Drawer>

        {/* Main Content */}
        <Layout
          style={{ background: "transparent" }}
          className={`min-h-screen ${isDark ? "dark" : ""} relative`}
        >
          <div
            className={`${removePadding ? "" : "p-4"} dark:text-white min-h-[calc(100vh-64px)] z-10`}
          >
            {account && children}
            {!account && (
              <div className="text-center text-lg text-gray-500">
                <Spin size="large" />
              </div>
            )}
          </div>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
