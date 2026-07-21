import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  FaBars,
  FaChartBar,
  FaBook,
  FaPenAlt,
  FaList,
  FaHistory,
  FaFileAlt,
  FaUserGraduate,
  FaClipboardList,
  FaPlus,
  FaUser,
  FaSignOutAlt,
  FaCalendarAlt,
  FaChartLine,
  FaHome,
} from "react-icons/fa";

import {
  ConfigProvider,
  Drawer,
  Layout,
  Menu,
  MenuProps,
  Space,
  Spin,
  Typography
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

export default function InstructorLayout({ children, selectedPage, removePadding, defaultCollapsed }: LayoutProps) {
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
        key: "return",
        label: <Link to="/">Página principal</Link>,
        icon: <FaHome />,
      },

      {
        key: "dashboard",
        label: <Link to="/instructor">Dashboard</Link>,
        icon: <FaChartBar />,
      },

      {
        key: "mis-cursos",
        label: "Mis Cursos",
        icon: <FaBook />,
        children: [
          {
            key: "my-courses",
            label: <Link to="/instructor/my-courses">Cursos Asignados</Link>,
            icon: <FaClipboardList />,
          },
        ],
      },

      {
        key: "notas",
        label: "Notas",
        icon: <FaPenAlt />,
        children: [
          {
            key: "record-grades",
            label: <Link to="/instructor/record-grades">Registrar Notas</Link>,
            icon: <FaPenAlt />,
          },
          {
            key: "class-roster",
            label: <Link to="/instructor/class-roster">Lista de Clase</Link>,
            icon: <FaList />,
          },
          {
            key: "grade-history",
            label: <Link to="/instructor/grade-history">Historial de Notas</Link>,
            icon: <FaHistory />,
          },
        ],
      },

      {
        key: "reportes",
        label: "Reportes",
        icon: <FaChartLine />,
        children: [
          {
            key: "course-detail",
            label: <Link to="/instructor/course-detail">Rendimiento del Curso</Link>,
            icon: <FaFileAlt />,
          },
        ],
      },

      {
        key: "solicitudes",
        label: "Solicitudes",
        icon: <FaClipboardList />,
        children: [
          {
            key: "create-request",
            label: <Link to="/instructor/create-request">Crear Solicitud</Link>,
            icon: <FaPlus />,
          },
          {
            key: "my-requests",
            label: <Link to="/instructor/my-requests">Mis Solicitudes</Link>,
            icon: <FaClipboardList />,
          },
        ],
      },

      {
        key: "profile",
        label: <Link to="/instructor/profile">Perfil</Link>,
        icon: <FaUser />,
      },

      {
        key: "logout",
        label: (
          <Link to="/auth/logout">
            Cerrar Sesión
          </Link>
        ),
        danger: true,
        icon: <FaSignOutAlt className="text-red-300" />,
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
              Portal del Docente | Universidad de Las Américas
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
            defaultOpenKeys={[
              "mis-cursos",
              "notas",
              "reportes",
              "solicitudes"
            ]}
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
            defaultOpenKeys={[
              "mis-cursos",
              "notas",
              "reportes",
              "solicitudes"
            ]}
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
          <div className={`${removePadding ? "" : "p-4"} dark:text-white min-h-[calc(100vh-64px)] z-10`}>
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
