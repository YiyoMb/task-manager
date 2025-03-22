import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Card,
  Typography,
  Spin,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import MainLayout from "../MainLayout";

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const token = localStorage.getItem("token");

  // Función para cargar usuarios
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.statusCode === 200) {
        // Mapear los datos para eliminar la contraseña por seguridad
        const mappedUsers = response.data.users.map((user) => ({
          ...user,
          password: undefined, // No mostrar la contraseña
          key: user.id, // Para la tabla de Ant Design
        }));
        setUsers(mappedUsers);
      } else {
        message.error("Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Manejar la creación o actualización de usuario
  const handleSave = async (values) => {
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/users/${editingUser.id}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.statusCode === 200) {
          message.success("Usuario actualizado con éxito");
          fetchUsers(); // Recargar la lista de usuarios
        }
      } else {
        // Crear nuevo usuario
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/register`,
          values,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.statusCode === 201) {
          message.success("Usuario creado con éxito");
          fetchUsers(); // Recargar la lista de usuarios
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMsg = error.response?.data?.intMessage || "Error al guardar usuario";
      message.error(errorMsg);
    }
  };

  // Manejar la eliminación de usuario
  const handleDelete = async (userId) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.statusCode === 200) {
        message.success("Usuario eliminado con éxito");
        fetchUsers(); // Recargar la lista de usuarios
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Error al eliminar usuario");
    }
  };

  // Abrir modal para editar
  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      gmail: record.gmail,
      rol: record.rol,
    });
    setModalVisible(true);
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Definir columnas para la tabla
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Email",
      dataIndex: "gmail",
      key: "gmail",
    },
    {
      title: "Rol",
      dataIndex: "rol",
      key: "rol",
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Manager", value: "manager" },
        { text: "User", value: "usuario" },
      ],
      onFilter: (value, record) => record.rol === value,
    },
    {
      title: "Último Login",
      dataIndex: "last_login",
      key: "last_login",
      render: (text) => {
        if (!text) return "-";
        const date = new Date(text);
        return date.toLocaleString();
      },
      sorter: (a, b) => new Date(a.last_login) - new Date(b.last_login),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="primary"
            size="small"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este usuario?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
        <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Title level={3}>Gestión de Usuarios</Title>
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleCreate}
            >
              Nuevo Usuario
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchUsers()}
            >
              Actualizar
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />

        <Modal
          title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingUser(null);
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{ rol: "user" }}
          >
            <Form.Item
              name="username"
              label="Nombre de usuario"
              rules={[{ required: true, message: "Por favor ingresa un nombre de usuario" }]}
            >
              <Input placeholder="Nombre de usuario" />
            </Form.Item>

            <Form.Item
              name="gmail"
              label="Correo electrónico"
              rules={[
                { required: true, message: "Por favor ingresa un correo" },
                { type: "email", message: "Ingresa un correo válido" },
              ]}
            >
              <Input placeholder="correo@ejemplo.com" />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: "Por favor ingresa una contraseña" },
                  { min: 6, message: "La contraseña debe tener al menos 6 caracteres" },
                ]}
              >
                <Input.Password placeholder="Contraseña" />
              </Form.Item>
            )}

            <Form.Item
              name="rol"
              label="Rol"
              rules={[{ required: true, message: "Por favor selecciona un rol" }]}
            >
              <Select placeholder="Selecciona un rol">
                <Option value="admin">Administrador</Option>
                <Option value="manager">Manager</Option>
                <Option value="user">Usuario</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button 
                  style={{ marginRight: 8 }} 
                  onClick={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingUser(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingUser ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
    </MainLayout>
  );
};

export default UserManagement;