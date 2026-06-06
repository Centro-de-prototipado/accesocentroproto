const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────
// 1. MQTT — Conexión al broker LOCAL (Mosquitto)
// ─────────────────────────────────────────────────────
const brokerUrl = process.env.MQTT_BROKER_URL?.trim() || 'mqtt://localhost:1883';
const mqttOptions = {
  clientId: 'backend_acceso_' + Math.random().toString(16).substring(2, 10),
  connectTimeout: 5000,
  reconnectPeriod: 2000,
};

// Solo añadir credenciales si están definidas en .env
if (process.env.MQTT_USERNAME) {
  mqttOptions.username = process.env.MQTT_USERNAME.trim();
  mqttOptions.password = process.env.MQTT_PASSWORD?.trim();
}

console.log(`📡 Intentando conectar a MQTT: ${brokerUrl} con usuario: ${mqttOptions.username}`);

const mqttClient = mqtt.connect(brokerUrl, mqttOptions);

mqttClient.on('error', (err) => {
  console.error('💥 MQTT Error:', err.message);
});

mqttClient.on('connect', () => {
  console.log(`✅ Conectado a broker MQTT: ${brokerUrl}`);
  mqttClient.subscribe('centro/acceso',      (err) => err && console.error('Sub error acceso:', err));
  mqttClient.subscribe('centro/estado',      (err) => err && console.error('Sub error estado:', err));
  mqttClient.subscribe('centro/enrolamiento',(err) => err && console.error('Sub error enrolamiento:', err));
});

mqttClient.on('reconnect', () => console.log('🔄 Reconectando a MQTT...'));
mqttClient.on('offline',   () => console.warn('⚠️  MQTT offline'));

// ─────────────────────────────────────────────────────
// 2. Procesamiento de mensajes MQTT
// ─────────────────────────────────────────────────────
mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    // ── Estado del dispositivo / heartbeat / progreso de enrolamiento
    if (topic === 'centro/estado') {
      if (payload.online !== undefined) {
        await prisma.dispositivo.upsert({
          where:  { id: payload.dispositivo },
          update: { estado: payload.online ? 'online' : 'offline', ultimo_ping: new Date() },
          create: { id: payload.dispositivo, nombre: payload.dispositivo, estado: payload.online ? 'online' : 'offline' }
        });
        console.log(`📡 Dispositivo: ${payload.dispositivo} → ${payload.online ? 'online' : 'offline'}`);
        io.emit('device_status', payload);

      } else if (payload.estado === 'esperando_dedo') {
        io.emit('enroll_progress', payload);

      } else if (payload.cmd_ejecutado === 'abrir') {
        console.log(`🚪 Dispositivo ${payload.dispositivo} abrió la puerta`);
      }
    }

    // ── Accesos y resultados de enrolamiento
    else if (topic === 'centro/acceso') {

      // Confirmación de borrado de huella desde el sensor
      if (payload.resultado === 'borrado' && (payload.miembro_id || payload.huella_id)) {
        console.log(`✅ Borrado confirmado: huella_id ${payload.huella_id}`);

        const memberId  = payload.miembro_id ? parseInt(payload.miembro_id) : null;
        const huellaId  = parseInt(payload.huella_id);

        const member = await prisma.miembro.findFirst({
          where: memberId ? { id: memberId } : { huella_id: huellaId }
        });

        if (member) {
          await prisma.miembroEliminado.create({
            data: {
              cedula:         member.cedula,
              nombre:         member.nombre,
              huella_id:      member.huella_id,
              telefono:       member.telefono,
              fecha_eliminacion: new Date(),
            }
          });

          await prisma.huellaDisponible.create({ data: { huella_id: member.huella_id } });
          await prisma.acceso.deleteMany({ where: { miembro_id: member.id } });
          await prisma.miembro.delete({ where: { id: member.id } });

          console.log(`🗑️  Miembro ${member.nombre} eliminado tras confirmación del sensor.`);
          io.emit('member_deleted_confirm', { id: member.id, huella_id: member.huella_id });
        }
        return;
      }

      // Resultados de enrolamiento
      if (['enrolado', 'timeout', 'error_coincidencia', 'error_guardado', 'memoria_llena'].includes(payload.resultado)) {
        console.log(`🔑 Resultado enrolamiento:`, payload.resultado);
        io.emit('enroll_result', {
          resultado: payload.resultado === 'enrolado' ? 'exito' : payload.resultado,
          huella_id: payload.huella_id
        });
        return;
      }

      // Evento de acceso normal
      let finalResult = payload.resultado;
      let member = null;

      if (payload.huella_id !== undefined && payload.huella_id !== null) {
        member = await prisma.miembro.findUnique({
          where:   { huella_id: parseInt(payload.huella_id) }
        });

        if (member) {
          if (member.estado === 'activo') finalResult = 'permitido';
          else                            finalResult = 'denegado_inactivo';
        } else {
          if (finalResult === 'permitido') finalResult = 'denegado';
        }
      }

      // Asegurar que el dispositivo exista en DB
      const dbDevice = await prisma.dispositivo.findUnique({ where: { id: payload.dispositivo } });
      if (!dbDevice) {
        await prisma.dispositivo.create({
          data: { id: payload.dispositivo, nombre: payload.dispositivo, estado: 'online' }
        });
      }

      const log = await prisma.acceso.create({
        data: {
          miembro_id:    member?.id || undefined,
          resultado:     finalResult,
          confianza:     payload.confianza || 0,
          dispositivo_id: payload.dispositivo
        },
        include: { miembro: true }
      });

      console.log(`🔒 Acceso: ${log.miembro?.nombre || 'Desconocido'} → ${finalResult}`);
      io.emit('access_event', log);
    }

    // ── Fallback: topic de enrolamiento antiguo
    else if (topic === 'centro/enrolamiento') {
      console.log(`📥 Enrolamiento (topic antiguo):`, payload);
      io.emit('enroll_result', payload);
    }

  } catch (error) {
    console.error('❌ Error procesando MQTT:', error.message);
  }
});

// ─────────────────────────────────────────────────────
// 3. API REST
// ─────────────────────────────────────────────────────

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalAccesses = await prisma.acceso.count({
      where: { timestamp: { gte: todayStart }, resultado: 'permitido' }
    });

    const failedAccesses = await prisma.acceso.count({
      where: { timestamp: { gte: todayStart }, resultado: { in: ['denegado', 'denegado_inactivo'] } }
    });

    const active = await prisma.miembro.count({ where: { estado: 'activo' } });
    const inactivos = await prisma.miembro.count({ where: { estado: 'inactivo' } });

    // Histograma por hora (hoy)
    const todayAccesses = await prisma.acceso.findMany({
      where:  { timestamp: { gte: todayStart } },
      select: { timestamp: true }
    });
    const histogram = Array(24).fill(0);
    todayAccesses.forEach(a => { histogram[new Date(a.timestamp).getHours()]++; });

    // Histograma semanal (últimos 7 días)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekAccesses = await prisma.acceso.findMany({
      where:  { timestamp: { gte: weekStart } },
      select: { timestamp: true }
    });
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const nd = new Date(d); nd.setDate(nd.getDate() + 1);
      const count = weekAccesses.filter(a => {
        const t = new Date(a.timestamp);
        return t >= d && t < nd;
      }).length;
      weekly.push({ day: weekDays[d.getDay()], date: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }), count });
    }

    res.json({ totalAccesses, failedAccesses, active, inactivos, histogram, weekly });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Obtener todos los accesos del día actual (para persistencia en pantalla)
app.get('/api/accesses/today', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const accesses = await prisma.acceso.findMany({
      where: { timestamp: { gte: todayStart } },
      include: { miembro: true },
      orderBy: { timestamp: 'desc' }
    });
    res.json(accesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Abrir puerta de forma remota
app.post('/api/devices/:id/open', (req, res) => {
  const { id } = req.params;
  mqttClient.publish('centro/comando', JSON.stringify({ cmd: 'abrir', dispositivo: id }));
  console.log(`📤 Comando ABRIR enviado a: ${id}`);
  res.json({ success: true, message: 'Comando de apertura enviado.' });
});

// Lista de miembros con filtros
app.get('/api/members', async (req, res) => {
  try {
    const { filter, hour } = req.query;
    let where = {};
    const now = new Date();

    if (filter === 'active') {
      where = { estado: 'activo' };

    } else if (filter === 'inactive') {
      where = { estado: 'inactivo' };

    } else if (filter === 'today' || filter === 'access_hour') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      let accessWhere = { timestamp: { gte: start } };

      if (filter === 'access_hour' && hour) {
        const h = parseInt(hour);
        const hStart = new Date(start); hStart.setHours(h);
        const hEnd   = new Date(start); hEnd.setHours(h + 1);
        accessWhere.timestamp = { gte: hStart, lt: hEnd };
      }

      const accesses  = await prisma.acceso.findMany({ where: accessWhere, select: { miembro_id: true } });
      const memberIds = [...new Set(accesses.map(a => a.miembro_id).filter(id => id !== null))];
      where = { id: { in: memberIds } };
    }

    const members = await prisma.miembro.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });
    res.json(members);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin && admin.password === password) {
      return res.json({ success: true, token: 'local-admin-token' });
    }
    // Credenciales de fallback hardcoded
    if (username === 'editnt' && password === '1727gym') {
      return res.json({ success: true, token: 'local-admin-token' });
    }
    res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear personal
app.post('/api/members', async (req, res) => {
  try {
    const { cedula, nombre, telefono, huella_id } = req.body;

    const nuevoMiembro = await prisma.miembro.create({
      data: {
        cedula,
        nombre,
        telefono,
        huella_id: parseInt(huella_id),
        estado:    'activo',
        rol:       'empleado'
      }
    });
    res.json({ success: true, member: nuevoMiembro });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Enviar comando de enrolamiento al ESP32
app.post('/api/devices/:id/enroll', (req, res) => {
  const { id } = req.params;
  const { huella_id } = req.body;
  mqttClient.publish('centro/comando', JSON.stringify({
    cmd:       'enrolar',
    huella_id: parseInt(huella_id),
    dispositivo: id
  }));
  console.log(`📤 Comando ENROLAR huella #${huella_id} enviado a: ${id}`);
  res.json({ success: true, message: 'Comando enrolar enviado.' });
});



// Eliminar miembro (envía comando MQTT al sensor, espera confirmación)
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.miembro.findUnique({ where: { id: parseInt(id) } });
    if (!member) return res.status(404).json({ error: 'Miembro no encontrado' });

    mqttClient.publish('centro/comando', JSON.stringify({
      cmd:        'borrar',
      huella_id:  member.huella_id,
      miembro_id: member.id
    }));

    console.log(`📤 Comando BORRAR enviado: ${member.nombre} (huella #${member.huella_id})`);
    res.json({ success: true, message: 'Comando de borrado enviado al sensor. Esperando confirmación...' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Limpieza semanal + exportación (simulada localmente)
app.post('/api/cleanup', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const allLogs = await prisma.acceso.findMany({ include: { miembro: true } });
    console.log(`📧 [SIMULADO] Exportando ${allLogs.length} registros a: ${email}`);

    await prisma.acceso.deleteMany({});
    console.log(`🧹 Base de datos de accesos limpiada.`);

    res.json({ success: true, message: `Backup simulado enviado a ${email} y logs limpiados.` });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Siguiente ID de huella disponible (reciclado o nuevo)
app.get('/api/next-huella-id', async (req, res) => {
  try {
    const recycled = await prisma.huellaDisponible.findFirst({ orderBy: { huella_id: 'asc' } });
    if (recycled) {
      return res.json({ huella_id: recycled.huella_id, recycled: true });
    }
    const maxMember = await prisma.miembro.findFirst({ orderBy: { huella_id: 'desc' } });
    res.json({ huella_id: (maxMember?.huella_id || 0) + 1, recycled: false });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Consumir un huella_id reciclado después del enrolamiento exitoso
app.delete('/api/free-huella/:huellaId', async (req, res) => {
  try {
    const huellaId = parseInt(req.params.huellaId);
    await prisma.huellaDisponible.deleteMany({ where: { huella_id: huellaId } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ─────────────────────────────────────────────────────
// 5. Data Retention — Export y limpieza de accesos
// ─────────────────────────────────────────────────────

// Exportar accesos anteriores a una fecha (CSV-ready JSON)
app.get('/api/accesses/export', async (req, res) => {
  try {
    const { before } = req.query;
    if (!before) return res.status(400).json({ error: 'Parámetro before (ISO date) requerido' });

    const beforeDate = new Date(before);
    const accesses = await prisma.acceso.findMany({
      where: { timestamp: { lt: beforeDate } },
      include: { miembro: true },
      orderBy: { timestamp: 'desc' }
    });

    res.json({ count: accesses.length, accesses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar accesos anteriores a una fecha
app.post('/api/accesses/cleanup', async (req, res) => {
  try {
    const { before } = req.body;
    if (!before) return res.status(400).json({ error: 'Parámetro before requerido' });

    const beforeDate = new Date(before);
    const deleted = await prisma.acceso.deleteMany({
      where: { timestamp: { lt: beforeDate } }
    });

    console.log(`🧹 Limpieza completada: ${deleted.count} registros eliminados (anteriores a ${before})`);
    res.json({ success: true, deleted: deleted.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subida simulada a Google Drive (genera un enlace de descarga local)
app.post('/api/accesses/upload-drive', async (req, res) => {
  try {
    const { csv, filename } = req.body;
    if (!csv) return res.status(400).json({ error: 'CSV requerido' });

    const fs = require('fs');
    const path = require('path');
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const filePath = path.join(exportDir, filename || `export_${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`📧 [SIMULADO] Archivo exportado localmente: ${filePath}`);
    res.json({ success: true, message: 'Archivo guardado localmente (simula subida a Drive)', path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salud del servidor
app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    time:     new Date().toISOString(),
    mqtt:     mqttClient.connected ? 'connected' : 'disconnected',
    database: 'sqlite-local'
  });
});

// ─────────────────────────────────────────────────────
// 4. Iniciar servidor
// ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
  console.log(`📡 MQTT Broker:        ${brokerUrl}`);
  console.log(`🗃️  Base de datos:      SQLite (local)`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
});
