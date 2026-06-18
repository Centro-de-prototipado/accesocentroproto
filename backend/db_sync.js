// db_sync.js
// Utilidad de sincronización y fallback para Supabase HTTP REST API
const axios = require('axios');

const SUPABASE_PROJECT_ID = 'jydthqekmccabtghokkd';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZHRocWVrbWNjYWJ0Z2hva2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODc0OTgsImV4cCI6MjA4ODY2MzQ5OH0.szK3hcxz9GQUFSLsMIAPzrZBXAY7b__rK6qe-_Tt-1U';

const supabaseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1`;

const headers = {
  'apikey': SUPABASE_API_KEY,
  'Authorization': `Bearer ${SUPABASE_API_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function fetchUsersFallback() {
  try {
    const res = await axios.get(`${supabaseUrl}/Usuario?select=*&order=nombre.asc`, { headers });
    return res.data;
  } catch (error) {
    console.error("Error fetching users via REST fallback:", error.message);
    return null;
  }
}

async function createUserFallback(userData) {
  try {
    const res = await axios.post(`${supabaseUrl}/Usuario`, userData, { headers });
    return res.data[0];
  } catch (error) {
    console.error("Error creating user via REST fallback:", error.message);
    throw error;
  }
}

async function deleteUserFallback(id) {
  try {
    const res = await axios.delete(`${supabaseUrl}/Usuario?id=eq.${id}`, { headers });
    return res.data;
  } catch (error) {
    console.error("Error deleting user via REST fallback:", error.message);
    throw error;
  }
}

async function renewUserFallback(id) {
  try {
    const res = await axios.patch(`${supabaseUrl}/Usuario?id=eq.${id}`, {
      estado: 'activo',
      fecha_registro: new Date().toISOString()
    }, { headers });
    return res.data[0];
  } catch (error) {
    console.error("Error renewing user via REST fallback:", error.message);
    throw error;
  }
}

module.exports = {
  fetchUsersFallback,
  createUserFallback,
  deleteUserFallback,
  renewUserFallback
};
