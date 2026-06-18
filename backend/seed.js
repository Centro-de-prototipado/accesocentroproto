/**
 * seed.js — Datos iniciales para la base de datos local
 * Ejecutar: node seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

    // Admin por defecto
    const hashedPassword = await bcrypt.hash('acceso_centro', 10);
    await prisma.admin.upsert({
      where: { username: 'centro' },
      update: { password: hashedPassword },
      create: { username: 'centro', password: hashedPassword }
    });
    console.log('✅ Admin creado: centro / acceso_centro (encriptado)');



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
  console.log('   Usuario admin: centro | Contraseña: acceso_centro');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
