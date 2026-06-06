/**
 * seed.js — Datos iniciales para la base de datos local
 * Ejecutar: node seed.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

    // Admin por defecto
    await prisma.admin.upsert({
      where: { username: 'editnt' },
      update: { password: '1727gym' },
      create: { username: 'editnt', password: '1727gym' }
    });
    console.log('✅ Admin creado: editnt / 1727gym');



  // Dispositivo ESP32 por defecto
  await prisma.dispositivo.upsert({
    where: { id: 'esp32c6_centro_01' },
    update: {},
    create: {
      id: 'esp32c6_centro_01',
      nombre: 'Sensor Puerta Principal',
      ubicacion: 'Entrada Principal',
      estado: 'offline'
    }
  });
  console.log('✅ Dispositivo ESP32 registrado.');

  console.log('');
  console.log('🎉 Seed completado exitosamente.');
  console.log('   Usuario admin: editnt | Contraseña: 1727gym');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
