import { Form, Input, Button, Card, Typography, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;

const RegisterPage = () => {
  const [form] = Form.useForm(); // Crear una referencia al formulario
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(""); 
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setFormError(""); 

    const { username, password, gmail } = values;
    const last_login = new Date().toISOString();
    const rol = "user";

    const payload = {
      username,
      password,
      gmail,
      last_login,
      rol,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/register`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      message.success("Registro exitoso");
      form.resetFields(); // Reiniciar los campos del formulario
      navigate("/login");
    } catch (error) {
      setFormError(error.response?.data?.intMessage || "Ocurrió un error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered={false}>
        <Title level={2} style={{ textAlign: "center", color: "#333" }}>
          Crear Cuenta
        </Title>
        
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: "Por favor, ingrese su usuario" }]}
          >
            <Input placeholder="Usuario" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: "Ingrese su contraseña" },
              { min: 8, message: "Debe tener al menos 8 caracteres" },
              { pattern: /[A-Z]/, message: "La contraseña debe contener al menos una letra mayúscula" },
              { pattern: /\d/, message: "La contraseña debe contener al menos un número" },
            ]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item
            label="Correo Electrónico"
            name="gmail"
            rules={[
              { required: true, message: "Por favor, ingrese su correo electrónico" },
              { type: "email", message: "El correo electrónico no es válido" },
            ]}
          >
            <Input placeholder="Correo electrónico" />
          </Form.Item>

          {formError && (
            <p style={styles.errorMessage}>{formError}</p>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={styles.button}
            >
              Registrar
            </Button>
          </Form.Item>
        </Form>
        <p>
          ¿Ya tienes cuenta? 
          <Button 
            type="link" 
            onClick={() => navigate("/login")}
            style={{ padding: 0, fontSize: "14px" }}
          >
            Iniciar sesión
          </Button>
        </p>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)", 
  },
  card: {
    width: 380,
    padding: 20,
    borderRadius: 10,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
    background: "#fff",
  },
  button: {
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
    fontSize: "16px",
  },
  errorMessage: {
    color: "#f5222d",
    marginBottom: "10px",
    fontSize: "14px",
    textAlign: "center",
  },
};

export default RegisterPage;
