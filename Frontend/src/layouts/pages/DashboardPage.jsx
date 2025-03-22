import React, { useState, useEffect } from "react";
import { Modal, Form, Input, DatePicker, Button, message, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";
import dayjs from "dayjs"; //Formato de fechas

const TaskForm = ({ visible, onCreate, onCancel, username, editingTask }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingTask) {
      form.setFieldsValue({
        ...editingTask,
        time_until_finish: editingTask.time_until_finish ? dayjs(editingTask.time_until_finish) : null,
        remind_me: editingTask.remind_me ? dayjs(editingTask.remind_me) : null, //Convertimos los datos de time_until_finish y remind_me a un objeto dayjs que es esperado por DatePicker
      });
    } else {
      form.resetFields(); // Limpiar el formulario si no hay tarea en edición
    }
  }, [editingTask, form]);

  const onFinish = (values) => {
    // Agregar el username a los valores antes de crear la tarea
    onCreate({ ...values, username, id: editingTask?.id });
    form.resetFields();
  };

  return (
    <Modal
      visible={visible}
      title={editingTask ? "Editar Tarea" : "Crear Tarea"}
      okText={editingTask ? "Actualizar" : "Crear"}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name_task"
          label="Nombre de la tarea"
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
          name="time_until_finish"
          label="Tiempo hasta terminar"
          rules={[{ required: true, message: "Por favor selecciona la fecha y hora" }]}
        >
          <DatePicker showTime />
        </Form.Item>
        <Form.Item
          name="remind_me"
          label="Recordarme"
          rules={[{ required: true, message: "Por favor selecciona la fecha y hora" }]}
        >
          <DatePicker showTime />
        </Form.Item>
        <Form.Item
          label="Estado"
          name="status"
          rules={[{ required: true, message: "Por favor, seleccione un estado" }]}
        >
          <Select placeholder="Seleccione un estado">
            <Select.Option value="In Progress">En Progreso</Select.Option>
            <Select.Option value="Done">Hecho</Select.Option>
            <Select.Option value="Paused">Pausado</Select.Option>
            <Select.Option value="Revision">Revisión</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="category"
          label="Categoría"
          rules={[{ required: true, message: "Por favor ingresa la categoría" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const DashboardPage = () => {
  const [visible, setVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null); // Nueva tarea en edición
  const userToken = localStorage.getItem("token"); // Obtener el token del usuario
  const username = localStorage.getItem("username"); // Obtener el username del usuario desde localStorage

  //Función para crear o editar una nueva task
  const onCreate = async (values) => {
    try {
      if(editingTask) {
        //Actualizar la tarea existente
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/tasks/${editingTask.id}`, values, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        message.success("Tarea actualizada correctamente");
      }
      else {
        // Crear una nueva tarea
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/tasks`, values, {
          headers: { Authorization: `Bearer ${userToken}` }, //token para autenticar la solicitud
        });
        message.success("Tarea creada correctamente");
      }
      setVisible(false);
      setEditingTask(null); // Limpiar la tarea en edición
      fetchTasks(); // Recargar las tareas
    } catch (error) {
      console.error("Error al guardar la tarea:", error);
      message.error("Error al guardar la tarea");
    }
  };

  //Función para encontrar tasks
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${userToken}`, // Enviar el token para autenticar la solicitud
        },
      });
      setTasks(response.data.tasks); // Almacenar las tareas en el estado
    } catch (error) {
      console.error("Error al obtener tareas:", error);
      message.error("Error al obtener tareas");
    }
  };

  //Función para eliminar Task
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/tasks/delete`, {
        headers: { Authorization: `Bearer ${userToken}` },
        data: { id: taskId },  // Enviar el ID dentro del cuerpo
      });
      message.success("Tarea eliminada correctamente");
      fetchTasks();
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);
      message.error("Error al eliminar la tarea");
    }
  };  

  useEffect(() => {
    fetchTasks(); // Cargar las tareas al montar el componente
  }, []);

  return (
    <MainLayout>
      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "justify", marginBottom: "20px" }}>Tareas</h2>
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          onClick={() => setVisible(true)}
          style={{ position: "fixed", bottom: 20, right: 20 }}
        />
        <div style={{ marginTop: "40px", backgroundColor: "#fff", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} style={{ border: "1px solid #d9d9d9", borderRadius: "4px", padding: "15px", margin: "10px 0", backgroundColor: "#f9f9f9" }}>
                <h4 style={{ margin: "0 0 10px" }}>{task.name_task}</h4>
                <p style={{ margin: "5px 0" }}>Estado: <strong>{task.status}</strong></p>
                <Button
                  type="default"
                  onClick={() => {
                    setEditingTask(task); // Guardar la tarea a editar en el estado
                    setVisible(true); // Mostrar el modal
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: "¿Estás seguro de eliminar esta tarea?",
                      content: "Esta acción no se puede deshacer.",
                      okText: "Sí, eliminar",
                      okType: "danger",
                      cancelText: "Cancelar",
                      onOk: () => deleteTask(task.id), // Llamar la función deleteTask si el usuario confirma
                    });
                  }}
                >
                  Eliminar
                </Button>
              </div>
              
            ))
          ) : (
            <p>No hay tareas disponibles.</p>
          )}
        </div>
        <TaskForm
          visible={visible}
          onCreate={onCreate}
          onCancel={() => {
            setVisible(false);
            setEditingTask(null);
          }}
          username={username} // Pasar el username al componente de formulario
          editingTask={editingTask} //Pasar la tarea al formulario
        />
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
