"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, ShieldCheck, ShieldAlert, Users, LayoutDashboard, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_URL } from '@/lib/config';

type AccessEvent = {
  id: number;
  resultado: string;
  confianza: number;
  timestamp: string;
  dispositivo_id: string;
  miembro?: { nombre: string; huella_id: number };
};

type WeeklyData = { day: string; date: string; count: number };

export default function Dashboard() {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [stats, setStats] = useState({ active: 0, grace: 0, expired: 0, totalAccesses: 0, histogram: Array(24).fill(0), weekly: [] as WeeklyData[] });

  useEffect(() => {
    localStorage.removeItem("adminToken");

    const socket = io(API_URL);
    
    socket.on('access_event', (data: AccessEvent) => {
      setEvents((prev) => [data, ...prev].slice(0, 10));
    });

    fetch(`${API_URL}/api/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Could not load stats.", err));

    return () => { socket.disconnect(); };
  }, []);

  const openDoor = () => {
    fetch(`${API_URL}/api/devices/esp32c6_gimnasio_01/open`, { method: 'POST' })
      .then(() => alert("¡Puerta abierta!"))
      .catch((e) => alert("Error: "+ e.message));
  }

  const histogramData = stats.histogram.map((count: number, hour: number) => ({
    hora: `${hour.toString().padStart(2, '0')}:00`,
    ingresos: count,
  }));
  const maxHour = Math.max(...stats.histogram, 1);

  const weeklyData = stats.weekly.map((d: WeeklyData) => ({
    label: `${d.day} ${d.date}`,
    ingresos: d.count,
  }));
  const maxWeek = Math.max(...stats.weekly.map((d: WeeklyData) => d.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-sm">Métricas en tiempo real y monitoreo de accesos</p>
        </div>
        <button onClick={openDoor} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg transition-colors flex items-center gap-2">
          <ShieldCheck size={18} /> Puerta Abierta Remota
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[{ title: "Accesos Hoy", val: stats.totalAccesses, icon: Activity, col: "text-blue-500" },
          { title: "Miembros Activos", val: stats.active, icon: Users, col: "text-green-500" },
          { title: "Periodo de Gracia", val: stats.grace, icon: LayoutDashboard, col: "text-yellow-500" },
          { title: "Vencidos", val: stats.expired, icon: ShieldAlert, col: "text-red-500" }].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className={`p-4 rounded-full bg-muted group-hover:scale-110 transition-transform ${stat.col} bg-opacity-20`}>
              <stat.icon size={24} className={stat.col} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <h3 className="text-3xl font-bold">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Hourly Histogram */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <BarChart3 size={20} className="text-blue-500" />
            <h3 className="text-lg font-bold">Afluencia por Hora — Hoy</h3>
          </div>
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  labelFormatter={(label) => `Hora: ${label}`}
                  formatter={(value: number) => [`${value} ingresos`, 'Cantidad']}
                />
                <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={index} fill={entry.ingresos === maxHour && entry.ingresos > 0 ? '#ef4444' : entry.ingresos > 0 ? '#3b82f6' : '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Histogram */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <Calendar size={20} className="text-red-500" />
            <h3 className="text-lg font-bold">Afluencia Semanal — Últimos 7 días</h3>
          </div>
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value} ingresos`, 'Cantidad']}
                />
                <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={index} fill={entry.ingresos === maxWeek && entry.ingresos > 0 ? '#ef4444' : entry.ingresos > 0 ? '#2563eb' : '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Events */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-xl font-bold">Accesos en Tiempo Real 🔴</h3>
        </div>
        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="mx-auto mb-4 opacity-50" size={32} />
              Esperando eventos del sensor biométrico...
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => {
                const getStyle = (res: string) => {
                  if (res.includes('permitido_gracia')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                  if (res.includes('permitido')) return 'bg-green-500/10 text-green-500 border-green-500/20';
                  if (res.includes('denegado_vencido')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
                  return 'bg-red-500/10 text-red-500 border-red-500/20';
                };

                const getLabel = (res: string) => {
                  if (res === 'permitido') return 'ACCESO PERMITIDO';
                  if (res === 'permitido_gracia') return 'PERMITIDO (GRACIA)';
                  if (res === 'denegado_vencido') return 'MEMBRESÍA VENCIDA';
                  return 'ACCESO DENEGADO';
                };

                return (
                  <div key={ev.id || i} className={`p-4 rounded-lg flex items-center justify-between border shadow-sm animate-in slide-in-from-left duration-300 ${getStyle(ev.resultado)}`}>
                    <div className="flex items-center gap-4">
                      {ev.resultado.includes('permitido') ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          {ev.miembro?.nombre || 'Huella Desconocida'}
                          <span className="text-xs opacity-70">ID: {ev.miembro?.huella_id || '?'}</span>
                        </p>
                        <p className="text-xs opacity-80 mt-1 uppercase tracking-wider font-semibold">{getLabel(ev.resultado)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(ev.timestamp || Date.now()).toLocaleTimeString()}</p>
                      <p className="text-xs opacity-70 mt-1">Confianza: {ev.confianza}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
