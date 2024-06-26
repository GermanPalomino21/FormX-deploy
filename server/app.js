const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const otpStorage = {};
const port = process.env.PORT || 3002;

// Configuración de la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos MySQL establecida');
});

// Habilita CORS para todas las solicitudes
app.use(cors());

// Parsea las solicitudes del tipo application/json
app.use(bodyParser.json());

// Ruta para autenticar el inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM usuario WHERE email_usuario = ? AND pss_usuario = ?';
  connection.query(query, [email, password], (error, results) => {
    if (error) {
      console.error('Error al verificar las credenciales del usuario:', error);
      return res.status(500).json({ error: 'Error al verificar las credenciales del usuario' });
    }
    if (results.length > 0) {
      res.json({ message: 'Inicio de sesión exitoso', id_usuario: results[0].id_usuario });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  });
});

// Configuración del transporter para enviar correos electrónicos
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Ruta para manejar la solicitud de recuperación de contraseña
app.post('/password-recovery', (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStorage[email] = parseInt(otp);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Recuperación de contraseña',
    text: `Tu código para recuperar tu contraseña es: ${otp}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar el correo electrónico:', error);
      res.status(500).json({ error: 'Error al enviar el correo electrónico' });
    } else {
      console.log('Correo electrónico enviado:', info.response);
      res.status(200).json({ message: 'Correo electrónico enviado con éxito' });
    }
  });
});

// Ruta para verificar si un correo electrónico existe en la base de datos
app.get('/verificar-correo', (req, res) => {
  const { email } = req.query;
  const query = 'SELECT COUNT(*) AS count FROM usuario WHERE email_usuario = ?';
  connection.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error al verificar el correo electrónico:', error);
      return res.status(500).json({ error: 'Error al verificar el correo electrónico' });
    }
    const correoExiste = results[0].count > 0;
    res.json({ exists: correoExiste });
  });
});

// Ruta para manejar la verificación del OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOTP = otpStorage[email];
  if (otp && storedOTP && otp === storedOTP) {
    res.status(200).json({ message: 'OTP verificado correctamente' });
  } else {
    res.status(400).json({ error: 'OTP incorrecto' });
  }
});

// Ruta para manejar el restablecimiento de la contraseña
app.post('/reset-password', (req, res) => {
  const { email, password } = req.body;
  const query = 'UPDATE usuario SET pss_usuario = ? WHERE email_usuario = ?';
  connection.query(query, [password, email], (error, results) => {
    if (error) {
      console.error('Error al actualizar la contraseña:', error);
      return res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  });
});

// Ruta para obtener las evaluaciones del usuario logeado
app.get('/evaluaciones/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;

  // Obtener el rol asociado y el proyecto del usuario
  const queryRolProyecto = 'SELECT id_rol, id_proyecto FROM usuario WHERE id_usuario = ?';
  connection.query(queryRolProyecto, [id_usuario], (error, results) => {
    if (error) {
      console.error('Error al obtener el rol y proyecto del usuario:', error);
      return res.status(500).json({ error: 'Error al obtener el rol y proyecto del usuario' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const id_rol = results[0].id_rol;
    const id_proyecto = results[0].id_proyecto;
    console.log(`Rol asociado: ${id_rol}, Proyecto ID: ${id_proyecto}`);

    // Obtener las categorías relacionadas con el rol y el proyecto
    const queryCategorias = 'SELECT id_categoria, nombre_categoria, descripcion_categoria, peso_categoria FROM categoria WHERE id_rol = ? AND id_proyecto = ?';
    connection.query(queryCategorias, [id_rol, id_proyecto], (error, resultsCategorias) => {
      if (error) {
        console.error('Error al obtener las categorías:', error);
        return res.status(500).json({ error: 'Error al obtener las categorías' });
      }
      if (resultsCategorias.length === 0) {
        return res.status(404).json({ error: `No se encontraron categorías para el rol ${id_rol} y el proyecto ${id_proyecto}` });
      }

      const categorias = {};
      resultsCategorias.forEach(categoria => {
        categorias[categoria.id_categoria] = categoria;
      });
      console.log('Categorías encontradas:', categorias);

      // Obtener las evaluaciones del usuario
      const queryEvaluaciones = `
        SELECT 
          p.nombre_proyecto, 
          c.nombre_cliente, 
          e.id_evaluacion, 
          e.id_proveedor, 
          pr.nombre_proveedor, 
          e.id_categoria, 
          cri.id_criterio, 
          cri.nombre_criterio, 
          cri.descripcion_criterio,
          cri.tipopregunta_criterio,
          cri.descripcion_calificacion1_criterio,
          cri.descripcion_calificacion2_criterio,
          cri.descripcion_calificacion3_criterio,
          cri.descripcion_calificacion4_criterio,
          cri.descripcion_calificacion5_criterio 
        FROM 
          evaluacion e 
          JOIN proveedor pr ON e.id_proveedor = pr.id_proveedor 
          JOIN categoria cat ON e.id_categoria = cat.id_categoria 
          JOIN criterio cri ON e.id_criterio = cri.id_criterio 
          JOIN proyecto p ON e.id_proyecto = p.id_proyecto 
          JOIN cliente c ON p.id_cliente = c.id_cliente 
        WHERE 
          e.id_usuario = ? AND cat.id_rol = ? AND cat.id_proyecto = ?`;

      connection.query(queryEvaluaciones, [id_usuario, id_rol, id_proyecto], (error, resultsEvaluaciones) => {
        if (error) {
          console.error('Error en la consulta de evaluaciones:', error);
          return res.status(500).json({ error: 'Error en la consulta de evaluaciones', details: error });
        }

        if (resultsEvaluaciones.length === 0) {
          return res.status(404).json({ error: 'No se encontraron evaluaciones para el usuario proporcionado' });
        }

        console.log('Evaluaciones encontradas:', resultsEvaluaciones);

        const evaluaciones = {};
        const projectInfo = {
          nombre_proyecto: resultsEvaluaciones[0].nombre_proyecto,
          nombre_cliente: resultsEvaluaciones[0].nombre_cliente,
        };

        resultsEvaluaciones.forEach(row => {
          const { id_proveedor, nombre_proveedor, id_categoria } = row;

          if (!evaluaciones[id_proveedor]) {
            evaluaciones[id_proveedor] = {
              id_proveedor: row.id_proveedor,
              nombre_proveedor: row.nombre_proveedor,
              categorias: {}
            };
          }

          if (!evaluaciones[id_proveedor].categorias[id_categoria]) {
            evaluaciones[id_proveedor].categorias[id_categoria] = {
              nombre_categoria: categorias[id_categoria].nombre_categoria,
              descripcion_categoria: categorias[id_categoria].descripcion_categoria,
              peso_categoria: categorias[id_categoria].peso_categoria,
              criterios: []
            };
          }

          evaluaciones[id_proveedor].categorias[id_categoria].criterios.push({
            id_criterio: row.id_criterio,
            nombre_criterio: row.nombre_criterio,
            descripcion_criterio: row.descripcion_criterio,
            tipopregunta_criterio: row.tipopregunta_criterio,
            descripcion_calificacion1_criterio: row.descripcion_calificacion1_criterio,
            descripcion_calificacion2_criterio: row.descripcion_calificacion2_criterio,
            descripcion_calificacion3_criterio: row.descripcion_calificacion3_criterio,
            descripcion_calificacion4_criterio: row.descripcion_calificacion4_criterio,
            descripcion_calificacion5_criterio: row.descripcion_calificacion5_criterio
          });
        });

        res.json({
          projectInfo,
          evaluaciones: Object.values(evaluaciones)
        });
      });
    });
  });
});

// Ruta para actualizar las calificaciones por proveedor y usuario
app.put('/actualizar-calificaciones', (req, res) => {
  const calificacionesPorProveedor = req.body;
  console.log('Calificaciones recibidas:', calificacionesPorProveedor);

  let hasError = false;
  const queries = [];

  calificacionesPorProveedor.forEach(({ id_proveedor, id_usuario, calificaciones }) => {
    calificaciones.forEach(({ id_criterio, calificacion }) => {
      console.log(`Actualizando proveedor: ${id_proveedor}, usuario: ${id_usuario}, criterio: ${id_criterio}, calificación: ${calificacion}`);
      
      const query = `UPDATE evaluacion SET calificacion_evaluacion = ? WHERE id_proveedor = ? AND id_criterio = ? AND id_usuario = ?`;
      const values = [calificacion, id_proveedor, id_criterio, id_usuario];
      
      queries.push(new Promise((resolve, reject) => {
        connection.query(query, values, (error, results) => {
          if (error) {
            console.error('Error al actualizar la calificación:', error);
            reject(error);
          } else {
            console.log(`Calificación actualizada para el proveedor ${id_proveedor}, usuario ${id_usuario} y el criterio ${id_criterio}: ${calificacion}`);
            resolve();
          }
        });
      }));
    });
  });

  Promise.all(queries)
    .then(() => {
      res.status(200).json({ message: 'Calificaciones actualizadas correctamente' });
    })
    .catch(error => {
      res.status(500).json({ error: 'Error al actualizar algunas calificaciones', details: error });
    });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});