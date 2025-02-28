import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Modal, Input, Typography, Form, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const { Title } = Typography;

const GroupTasksPage = () => {
  const { groupId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`/groups/${groupId}/groupTasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      message.error('Error al cargar tareas');
    }
  };

  useEffect(() => {
    // Cargar todos los usuarios
    axios.get('/users', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        setUsers(response.data.users);
    })
    .catch(error => {
        console.error('Error al obtener usuarios:', error);
        message.error('Error al cargar usuarios');
    });

    // Cargar todas las tareas del grupo
    fetchTasks();
  }, [token, groupId]);

  const handleCreateTask = async (values) => {
    try {
        const { name, description, assignedTo, status } = values;

        await axios.post(`/groups/${groupId}/groupTasks`, {
            name,
            description,
            assignedTo,
            status
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        message.success("Tarea creada correctamente");
        setIsModalOpen(false);
        form.resetFields();
        fetchTasks();
    } catch (error) {
        console.error('Error al crear la tarea:', error.response?.data?.message || error.message);
        message.error(error.response?.data?.message || 'Error al crear la tarea');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/groups/${groupId}/groupTasks/${taskId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success("Estado de la tarea actualizado correctamente");
      fetchTasks();
    } catch (error) {
      console.error('Error al actualizar el estado de la tarea:', error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || 'Error al actualizar el estado de la tarea');
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const task = tasks.find(task => task.id === draggableId);

    // Verificar si el usuario actual es el asignado a la tarea
    if (task.assignedTo !== userId) {
      message.error('No tienes permiso para actualizar esta tarea');
      return;
    }

    handleUpdateTaskStatus(draggableId, destination.droppableId);
  };

  return (
    <div>
      <Title level={2}>Tareas del Grupo</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 20 }}
      >
        Crear Nueva Tarea
      </Button>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['Por Hacer', 'En Progreso', 'Finalizada'].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ width: '30%', minHeight: '400px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}
                >
                  <Title level={4}>{status}</Title>
                  {tasks.filter(task => task.status === status).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...provided.draggableProps.style, marginBottom: '10px' }}
                        >
                          <Card title={task.name}>
                            <p>{task.description}</p>
                            <p>Asignado a: {users.find(user => user.id === task.assignedTo)?.username}</p>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <Modal
        title="Crear Nueva Tarea"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Crear"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            name="name"
            label="Nombre de la Tarea"
            rules={[{ required: true, message: "Por favor ingresa el nombre de la tarea" }]}
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
            name="assignedTo"
            label="Asignar a"
            rules={[{ required: true, message: "Por favor selecciona un usuario" }]}
          >
            <Select placeholder="Selecciona un usuario">
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="Estado"
            rules={[{ required: true, message: "Por favor selecciona un estado" }]}
          >
            <Select placeholder="Selecciona un estado">
              <Select.Option value="Por Hacer">Por Hacer</Select.Option>
              <Select.Option value="En Progreso">En Progreso</Select.Option>
              <Select.Option value="Finalizada">Finalizada</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupTasksPage;