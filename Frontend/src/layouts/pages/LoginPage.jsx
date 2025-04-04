import { Form, Input, Button, Card, Typography, message } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(""); 
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setFormError(""); 

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/validate`, 
        values,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      message.success("Inicio de sesión exitoso");
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("username", response.data.data.user.username);
      localStorage.setItem("role", response.data.data.user.rol); // Cambiado de role a rol para coincidir con el backend
      navigate("/dashboard");
    } catch (error) {
      // Manejo de errores mejorado
      if (error.response) {
        // La respuesta fue recibida pero con un código de estado de error
        if (error.response.status === 401) {
          setFormError("Credenciales incorrectas");
        } else {
          setFormError(`Error en la autenticación: ${error.response.data.intMessage || 'Verifica tus datos'}`);
        }
      } else if (error.request) {
        // La solicitud fue realizada pero no se recibió respuesta
        setFormError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        // Error al configurar la solicitud
        setFormError("Error en la solicitud de autenticación");
      }
      console.error("Error completo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.margin = "0";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
  }, []);

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered={false}>
        <Title level={2} style={{ textAlign: "center", color: "#333" }}>
          Iniciar Sesión
        </Title>
        
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: "Por favor, ingrese su usuario" }]}
            validateStatus={formError ? "error" : ""}
            help={formError && formError}
          >
            <Input placeholder="Usuario" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: "Ingrese su contraseña" },
              { min: 6, message: "Debe tener al menos 6 caracteres" },
            ]}
            validateStatus={formError ? "error" : ""}
            help={formError && formError}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={styles.button}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
        <div style={styles.center}>
          <p>
            ¿Aún no tienes cuenta? 
            <Button 
              type="link" 
              onClick={() => navigate("/register")}
              style={{ padding: 0, fontSize: "14px" }}
            >
              Registrar aquí
            </Button>
          </p>
        </div>
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
  center: {
    textAlign: "center", 
    marginTop: "10px",
  },
};

export default LoginPage;
