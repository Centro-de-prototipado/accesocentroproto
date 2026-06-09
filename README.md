# AccesoControl — Sistema Biométrico Local

Sistema de control de acceso biométrico con ESP32 + sensor de huella, 100% local.
No requiere Supabase, Vercel ni HiveMQ.

## Arquitectura

```
ESP32 (WiFi) ──MQTT──► HiveMQ Cloud (mqtts)
                               │
                    Backend Node.js :4000
                    Prisma ORM → SQLite
                    Socket.IO WebSockets
                               │
                    Frontend Next.js :3000
```

## Requisitos previos

- Node.js 18+
- Mosquitto instalado y corriendo en `localhost:1883`

### Verificar Mosquitto

```powershell
mosquitto -v        # Muestra versión
# O iniciar manualmente:
net start mosquitto
```

---

## 1. Configurar y arrancar el Backend

```powershell
cd backend
npm install
npx prisma migrate dev --name init
node seed.js
npm run dev
```

El servidor queda en: **http://localhost:4000**

### Verificar que funciona

```powershell
curl http://localhost:4000/api/health
```

---

## 2. Arrancar el Frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

La interfaz queda en: **http://localhost:3000**

---

## 3. Configurar el ESP32

En el firmware del ESP32, actualiza el broker MQTT a la **IP local de tu PC**:

```cpp
// En lugar de HiveMQ cloud:
const char* mqtt_server = "192.168.X.X";   // IP de tu PC en la red local
const int   mqtt_port   = 1883;             // Sin TLS
// Sin usuario ni contraseña (Mosquitto local sin auth)
```

Para encontrar tu IP local:
```powershell
ipconfig | findstr "IPv4"
```

### Topics MQTT usados

| Topic | Dirección | Descripción |
|---|---|---|
| `gimnasio/acceso` | ESP32 → Backend | Eventos de acceso y enrolamiento |
| `gimnasio/estado` | ESP32 → Backend | Heartbeat y progreso de enrolamiento |
| `gimnasio/comando` | Backend → ESP32 | Comandos: abrir, enrolar, borrar |

---

## Credenciales por defecto

| Campo | Valor |
|---|---|
| Usuario admin | `centro` |
| Contraseña | `12345678` |

---

## Scripts útiles

```powershell
# Reiniciar base de datos
cd backend && node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.acceso.deleteMany().then(()=>p.$disconnect())"

# Ver base de datos visualmente
cd backend && npx prisma studio

# Limpiar y recrear DB
cd backend && del dev.db && npx prisma migrate dev --name init && node seed.js
```
