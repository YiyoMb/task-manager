import React, { useState, useEffect } from "react";
import { Card, Button, List, Modal, Input, Typography, Badge, Form, Select, message } from "antd";
import { PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import MainLayout from "../MainLayout";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]); //Cargar la lista de usuarios
  const [form] = Form.useForm();
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      message.error('Error al cargar grupos');
    }
  };
  
  useEffect(() => {
    //Cargar todos los usuarios
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/users`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        setUsers(response.data.users);
    })
    .catch(error => {
        console.error('Error al obtener usuarios:', error);
        message.error('Error al cargar usuarios');
    });

    // Cargar todos los grupos
    fetchGroups();
  }, []);

  const handleCreateGroup = async (values) => {
    try {
        // Asegúrate de que los valores estén definidos y no sean undefined
        const groupName = values.name_group ? values.name_group.trim() : '';
        const description = values.description ? values.description.trim() : '';
        const members = values.users || [];

        // Validar si los valores están presentes
        if (!groupName || !description || members.length === 0) {
            message.error('Por favor completa todos los campos');
            return;
        }

        // Enviar los valores limpios a la API
        const cleanedValues = {
            groupName,
            description,
            members,
        };

        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/groups`, cleanedValues, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        message.success("Grupo creado correctamente");
        setIsModalOpen(false); // Cerrar el modal
        form.resetFields(); // Reiniciar los campos del formulario
        fetchGroups(); // Recargar los grupos
    } catch (error) {
        console.error('Error al crear el grupo:', error.response?.data?.message || error.message);
        message.error(error.response?.data?.message || 'Error al crear el grupo');
    }
  };

  const handleViewDetails = (groupId) => {
    navigate(`/groups/${groupId}/tasks`);
  };

  return (
    <MainLayout>
      <Title level={2}>Mis Grupos</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 20 }}
      >
        Crear Nuevo Grupo
      </Button>
      
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={groups}
        renderItem={(group) => (
          <List.Item>
            <Badge.Ribbon text={group.createdBy === username ? "Admin" : "Miembro"} color={group.createdBy === username ? "blue" : "gray"}>
              <Card
                title={group.groupName}
                extra={<Button type="link" onClick={() => handleViewDetails(group.id)}>Ver Detalles</Button>}
              >
                <p>📌 Grupo {group.createdBy === username ? "administrado por ti" : "donde eres miembro"}.</p>
              </Card>
            </Badge.Ribbon>
          </List.Item>
        )}
      />
      
      <Modal
        title="Crear Nuevo Grupo"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()} // Llama a form.submit() en lugar de handleCreateGroup
        okText="Crear"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateGroup}>
        <Form.Item
          name="name_group"
          label="Nombre del Grupo"
          rules={[{ required: true, message: "Por favor ingresa el nombre del grupo" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Descripción"
          rules={[{ required: true, message: "Por favor ingresa la descripción" }]}
        >
          <Input.TextArea />
        </Form.Item>
        
        <Form.Item
          label="Usuarios"
          name="users"
          rules={[{ required: true, message: "Por favor, seleccione al menos un usuario" }]}
        >
            <Select
            mode="multiple"
            placeholder="Selecciona usuarios"
            optionLabelProp="label"
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id} label={user.username}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
      </Modal>
    </MainLayout>
  );
};

export default GroupsPage;