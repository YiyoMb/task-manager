require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require("cors"); 
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

const serviceAccount = JSON.parse(fs.readFileSync('./firebase/firebase-key.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


admin.firestore().collection('users').limit(1).get()
    .then(() => {
        console.log('Conexión a Firebase establecida correctamente');
    })
    .catch((err) => {
        console.error('Error al conectar con Firebase:', err);
    });

const db = admin.firestore();

app.use(cors()); 
app.use(express.json());

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '60m' });
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ statusCode: 403, message: 'Token no proporcionado' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Error al verificar el token:', err); 
            return res.status(401).json({ statusCode: 401, message: 'Token no válido' });
        }
        req.username = decoded.userId || decoded.username;
        req.userId = decoded.userId;
        next();
    }); 
}; 

//REGISTRAR NUEVO USUARIO
app.post('/register', async (req, res) => {
    const { username, password, gmail, rol } = req.body;
    const last_login = new Date().toISOString(); 

    if (!username || !password || !gmail || !rol) {
        return res.status(400).json({ statusCode: 400, intMessage: 'Todos los campos son obligatorios' });
    }

    try {
        const usersRef = db.collection('USERS');
        const existingUser = await usersRef.where('username', '==', username).get();
        const existingGmail = await usersRef.where('gmail', '==', gmail).get();

        if (!existingUser.empty || !existingGmail.empty) {
            return res.status(409).json({ statusCode: 409, intMessage: 'El username o gmail ya están en uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await usersRef.add({
            username,
            password: hashedPassword,
            gmail,
            last_login,
            rol
        });

        return res.status(201).json({ statusCode: 201, intMessage: 'Usuario registrado con éxito', data: { username, gmail } });

    } catch (err) {
        console.error('Error registrando usuario:', err);
        return res.status(500).json({ statusCode: 500, intMessage: 'Internal Server Error' });
    }
});

//LOGIN DE USUARIO
app.post('/validate', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ statusCode: 400, intMessage: 'Se requieren username y password' });
    }

    try {
        const usersRef = db.collection('USERS');
        const querySnapshot = await usersRef.where('username', '==', username).get();

        if (querySnapshot.empty) {
            return res.status(401).json({ statusCode: 401, intMessage: 'Credenciales incorrectas' });
        }

        const user = querySnapshot.docs[0].data();
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ statusCode: 401, intMessage: 'Credenciales incorrectas' });
        }

        const token = generateToken(user.username);

        return res.status(200).json({
            statusCode: 200,
            intMessage: 'Operación exitosa',
            data: {
                message: 'Autenticación exitosa',
                user: { 
                    username: user.username, 
                    gmail: user.gmail,
                    role: user.rol,
                },
                token
            }
        });

    } catch (err) {
        console.error('Error al validar usuario:', err);
        return res.status(500).json({ statusCode: 500, intMessage: 'Error interno del servidor', error: err.message });
    }
});

//OBTENER TODOS LOS USUARIOS
app.get('/users', async (req, res) => {
    try {
        // Consulta todos los usuarios de la colección 'USERS'
        const usersSnapshot = await db.collection('USERS').get();
        
        // Si no hay usuarios, retornamos un mensaje indicando que no se encontraron
        if (usersSnapshot.empty) {
            return res.status(404).json({ statusCode: 404, message: 'No se encontraron usuarios' });
        }

        // Mapear los resultados para devolver los datos de los usuarios
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data()
        }));

        // Retornar la lista de usuarios
        res.status(200).json({ statusCode: 200, users });
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ statusCode: 500, message: 'Error al obtener los usuarios', error: err.message });
    }
});

// ACTUALIZAR USUARIO
app.put('/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { username, gmail, rol } = req.body;
    const password = req.body.password; // Solo lo procesaremos si está presente

    try {
        const userRef = db.collection('USERS').doc(id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ statusCode: 404, message: 'Usuario no encontrado' });
        }

        // Crear objeto de actualización
        const updateData = {};
        
        if (username) updateData.username = username;
        if (gmail) updateData.gmail = gmail;
        if (rol) updateData.rol = rol;
        
        // Solo actualizar la contraseña si se proporciona
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await userRef.update(updateData);
        
        res.status(200).json({ statusCode: 200, message: 'Usuario actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ statusCode: 500, message: 'Error al actualizar usuario', error: err.message });
    }
});

// ELIMINAR USUARIO
app.delete('/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const userRef = db.collection('USERS').doc(id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ statusCode: 404, message: 'Usuario no encontrado' });
        }

        await userRef.delete();
        
        res.status(200).json({ statusCode: 200, message: 'Usuario eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ statusCode: 500, message: 'Error al eliminar usuario', error: err.message });
    }
});

// OBTENER ROL DE USUARIO
app.get('/user/role', verifyToken, async (req, res) => {
    try {
        const username = req.username;
        
        const usersRef = db.collection('USERS');
        const querySnapshot = await usersRef.where('username', '==', username).get();
        
        if (querySnapshot.empty) {
            return res.status(404).json({ statusCode: 404, message: 'Usuario no encontrado' });
        }
        
        const userData = querySnapshot.docs[0].data();
        
        res.status(200).json({ 
            statusCode: 200, 
            message: 'Rol obtenido con éxito',
            data: { 
                username: userData.username,
                rol: userData.rol 
            }
        });
    } catch (err) {
        console.error('Error al obtener rol de usuario:', err);
        res.status(500).json({ statusCode: 500, message: 'Error al obtener rol de usuario', error: err.message });
    }
});

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$[      APIS TASK         ]$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//CREAR NUEVA TASK
app.post('/tasks', verifyToken, async (req, res) => {
    try {
        const { category, description, name_task, status, time_until_finish, remind_me } = req.body;

        if (!category || !description || !name_task || !status || !time_until_finish || !remind_me) {
            return res.status(400).json({ statusCode: 400, message: 'Todos los campos son obligatorios' });
        }

        const timestamp = new Date().toISOString();
        const newTask = { 
            category, 
            description, 
            name_task, 
            status, 
            time_until_finish, 
            remind_me, 
            timestamp,
            username: req.username 
        }; 

        const docRef = await db.collection('task').add(newTask);
        res.status(201).json({ statusCode: 201, message: 'Tarea creada con éxito', taskId: docRef.id });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'Error al crear la tarea', error: err.message });
    }
});

//OBTENER TASK DE USUARIO
app.get('/tasks', verifyToken, async (req, res) => {
    try {
        const username = req.username; 

        const tasksSnapshot = await db.collection('task').where('username', '==', username).get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ statusCode: 200, tasks });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'Error al obtener tareas', error: err.message });
    }
});

//OBTENER TODAS LAS TASK
app.get('/all-tasks', async (req, res) => {
    try {
        const tasksSnapshot = await db.collection('task').get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ statusCode: 200, tasks });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'Error al obtener todas las tareas', error: err.message });
    }
});

//EDITAR TASK
app.put('/tasks/:taskId', verifyToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { category, description, name_task, status, time_until_finish, remind_me } = req.body;

        if (!category || !description || !name_task || !status || !time_until_finish || !remind_me) {
            return res.status(400).json({ statusCode: 400, message: 'Todos los campos son obligatorios' });
        }

        const taskRef = db.collection('task').doc(taskId);
        const doc = await taskRef.get();

        if (!doc.exists) {
            return res.status(404).json({ statusCode: 404, message: 'Tarea no encontrada' });
        }

        await taskRef.update({
            category,
            description,
            name_task,
            status,
            time_until_finish,
            remind_me,
            updated_at: new Date().toISOString(),
        });

        res.status(200).json({ statusCode: 200, message: 'Tarea actualizada con éxito' });

    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'Error al actualizar la tarea', error: err.message });
    }
});

//ELIMINAR TASK
app.delete("/tasks/delete", async (req, res) => {
const { id } = req.body;

if (!id) {
    return res.status(400).json({ message: "Se requiere el ID de la tarea" });
}

try {
    await db.collection("task").doc(id).delete();
    res.json({ message: "Tarea eliminada correctamente" });
} catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ message: "Error al eliminar tarea" });
}
});


//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$[      APIS GROUPS         ]$$$$$$$$$$$$$$$$$$$$$$$$$$$$
  
//CREAR NUEVO GRUPO
app.post('/groups', verifyToken, async (req, res) => {
    const { groupName, description, members } = req.body;

    if (!groupName || !description || !members) {
        return res.status(400).json({ statusCode: 400, message: 'Todos los campos son obligatorios' });
    }

    if (typeof groupName !== 'string' || typeof description !== 'string' || !Array.isArray(members)) {
        return res.status(400).json({ statusCode: 400, message: 'Formato de datos incorrecto' });
    }

    if (groupName.trim() === '' || description.trim() === '' || members.length === 0) {
        return res.status(400).json({ statusCode: 400, message: 'Todos los campos deben contener datos válidos' });
    }

    try {
        // Creación de un nuevo grupo en Firestore
        const groupRef = db.collection('groups');
        const newGroup = await groupRef.add({
            groupName: groupName.trim(),
            description: description.trim(),
            members,
            createdBy: req.username, // Agregar el ID del usuario que creó el grupo
            createdAt: new Date().toISOString(),
        });

        return res.status(201).json({ statusCode: 201, message: 'Grupo creado con éxito', groupId: newGroup.id });
    } catch (err) {
        console.error('Error al crear el grupo:', err);
        return res.status(500).json({ statusCode: 500, message: 'Error al crear el grupo' });
    }
});

//OBTENER TODOS LOS GRUPOS
app.get('/groups', verifyToken, async (req, res) => {
    try {
        // Consulta todos los grupos de la colección 'groups'
        const groupsSnapshot = await db.collection('groups').get();
        
        // Si no hay grupos, retornamos un mensaje indicando que no se encontraron
        if (groupsSnapshot.empty) {
            return res.status(404).json({ statusCode: 404, message: 'No se encontraron grupos' });
        }

        // Mapear los resultados para devolver los datos de los grupos
        const groups = groupsSnapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data()
        }));

        // Retornar la lista de grupos
        res.status(200).json({ statusCode: 200, groups });
    } catch (err) {
        console.error('Error al obtener grupos:', err);
        res.status(500).json({ statusCode: 500, message: 'Error al obtener los grupos', error: err.message });
    }
});

// CREAR NUEVA TAREA EN UN GRUPO
app.post('/groups/:groupId/groupTasks', verifyToken, async (req, res) => {
    const { groupId } = req.params;
    const { name, description, assignedTo, status } = req.body;

    if (!name || !description || !assignedTo || !status) {
        return res.status(400).json({ statusCode: 400, message: 'Todos los campos son obligatorios' });
    }

    try {
        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ statusCode: 404, message: 'Grupo no encontrado' });
        }

        const groupData = groupDoc.data();
        if (groupData.createdBy !== req.userId) {
            return res.status(403).json({ statusCode: 403, message: 'No tienes permiso para crear tareas en este grupo' });
        }

        const taskRef = db.collection('groupTasks');
        const newTask = await taskRef.add({
            groupId,
            name,
            description,
            status,
            assignedTo,
            createdBy: req.userId,
            createdAt: new Date().toISOString(),
        });

        return res.status(201).json({ statusCode: 201, message: 'Tarea creada con éxito', taskId: newTask.id });
    } catch (err) {
        console.error('Error al crear la tarea:', err);
        return res.status(500).json({ statusCode: 500, message: 'Error al crear la tarea' });
    }
});

// OBTENER TAREAS DE UN GRUPO
app.get('/groups/:groupId/groupTasks', verifyToken, async (req, res) => {
    const { groupId } = req.params;

    try {
        const tasksSnapshot = await db.collection('groupTasks').where('groupId', '==', groupId).get();

        if (tasksSnapshot.empty) {
            return res.status(404).json({ statusCode: 404, message: 'No se encontraron tareas' });
        }

        const tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({ statusCode: 200, tasks });
    } catch (err) {
        console.error('Error al obtener las tareas:', err);
        return res.status(500).json({ statusCode: 500, message: 'Error al obtener las tareas', error: err.message });
    }
});

// ACTUALIZAR ESTADO DE UNA TAREA EN UN GRUPO
app.put('/groups/:groupId/groupTasks/:taskId/status', verifyToken, async (req, res) => {
    const { groupId, taskId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ statusCode: 400, message: 'El campo status es obligatorio' });
    }

    try {
        const taskRef = db.collection('groupTasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ statusCode: 404, message: 'Tarea no encontrada' });
        }

        const taskData = taskDoc.data();
        if (taskData.assignedTo !== req.userId) {
            return res.status(403).json({ statusCode: 403, message: 'No tienes permiso para actualizar esta tarea' });
        }

        await taskRef.update({
            status,
            updatedAt: new Date().toISOString(),
        });

        return res.status(200).json({ statusCode: 200, message: 'Estado de la tarea actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar el estado de la tarea:', err);
        return res.status(500).json({ statusCode: 500, message: 'Error al actualizar el estado de la tarea' });
    }
});


//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$[      APIS ADMIN       ]$$$$$$$$$$$$$$$$$$$$$$$$$$$$


app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
