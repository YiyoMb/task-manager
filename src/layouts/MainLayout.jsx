import React from "react";
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import { DashboardOutlined, UserOutlined, SettingOutlined, TeamOutlined, UsergroupAddOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={250}
        theme="dark"
        style={{ borderRight: "1px solid #ddd" }}
      >
        <div style={styles.logo}>
          <h2 style={{ color: "#fff" }}>Bienvenido, {username}</h2>
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
          {/* Opciones comunes para todos los usuarios */}
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<TeamOutlined />}>
            <Link to="/groups">Grupos</Link>
          </Menu.Item>

          {/* Opciones solo para administradores */}
          {(role === "admin") && (
            <>
              <Menu.Item key="5" icon={<UsergroupAddOutlined />}>
                <Link to="/users">Gestión de Usuarios</Link>
              </Menu.Item>
            </>
          )}
        </Menu>
      </Sider>
      <Layout>
        <Content style={styles.content}>
          <div style={styles.container}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

const styles = {
  logo: {
    padding: "16px",
    textAlign: "center",
    borderBottom: "1px solid #444",
  },
  content: {
    margin: "16px 16px",
    padding: "20px",
    backgroundColor: "#fff",
    minHeight: "calc(100vh - 64px)",
    borderRadius: "10px",
    boxShadow: "#17211F",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
};

export default MainLayout;
