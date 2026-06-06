"use client";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, ShieldCheck, ShieldAlert, Users, Flame, TrendingUp, Calendar, Download, X, Clock, Zap, Target, Sparkles, Smartphone, Cloud, Trash2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
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

function AnimatedCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black tracking-tight">
        <span className="text-gradient">{display.toLocaleString()}{suffix}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient, delay, onClick }: {
  title: string; value: number; icon: any; gradient: string; delay: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative glass rounded-2xl p-6 cursor-pointer overflow-hidden animate-tnt-slide-up ${delay}`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-black tracking-tight text-white">{value}</span>
        </div>
        <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full rounded-full ${gradient} transition-all duration-1000`} style={{ width: `${Math.min(value * 10, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev, index }: { ev: AccessEvent; index: number }) {
  const isPermitted = ev.resultado.includes('permitido');
  const isGrace = ev.resultado.includes('gracia');
  const isExpired = ev.resultado.includes('vencido');
  const isMoroso = ev.resultado.includes('moroso');
  const isDenied = !isPermitted && !isGrace && !isExpired && !isMoroso;

  const getConfig = () => {
    if (isDenied) return { color: 'from-red-500/20 to-red-600/5', border: 'border-red-500/20', icon: ShieldAlert, glow: 'shadow-red-500/10', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'DENEGADO', badgeColor: 'bg-red-500/20 text-red-400' };
    if (isExpired) return { color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20', icon: ShieldAlert, glow: 'shadow-orange-500/10', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'VENCIDO', badgeColor: 'bg-orange-500/20 text-orange-400' };
    if (isMoroso) return { color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20', icon: ShieldAlert, glow: 'shadow-orange-500/10', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'RENOVAR MENSUALIDAD', badgeColor: 'bg-orange-500/20 text-orange-400' };
    if (isGrace) return { color: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/20', icon: ShieldCheck, glow: 'shadow-yellow-500/10', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'GRACIA', badgeColor: 'bg-yellow-500/20 text-yellow-400' };
    return { color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20', icon: ShieldCheck, glow: 'shadow-green-500/10', bg: 'bg-green-500/10', text: 'text-green-400', badge: 'PERMITIDO', badgeColor: 'bg-green-500/20 text-green-400' };
  };

  const cfg = getConfig();
  const IconComponent = cfg.icon;

  return (
    <div
      className={`relative glass rounded-xl p-4 border ${cfg.border} animate-tnt-slide-left shadow-sm`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r ${cfg.color} opacity-50" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center ${cfg.text}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white flex items-center gap-2 text-sm">
              {ev.miembro?.nombre || 'Huella Desconocida'}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badgeColor}`}>
                {cfg.badge}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ID: {ev.miembro?.huella_id || '?'} · Confianza: {ev.confianza}%
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-white">{new Date(ev.timestamp || Date.now()).toLocaleTimeString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(ev.timestamp || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [stats, setStats] = useState({ active: 0, inactive: 0, totalAccesses: 0, failedAccesses: 0, histogram: Array(24).fill(0), weekly: [] as WeeklyData[] });
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isForcedCleanup, setIsForcedCleanup] = useState(false);
  const [cleanupOption, setCleanupOption] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
  // Admin Auth for Open Door
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    setMounted(true);
    localStorage.removeItem("adminToken");

    const socket = io(API_URL);
    socket.on('access_event', (data: AccessEvent) => {
      setEvents((prev) => [data, ...prev].slice(0, 15));
    });
    socket.on('members_auto_deleted', () => {
      fetch(`${API_URL}/api/stats`).then(r => r.json()).then(d => setStats(prev => ({ ...prev, ...d })));
    });

    fetch(`${API_URL}/api/stats`)
      .then(res => {
        if (!res.ok) throw new Error("Error loading stats");
        return res.json();
      })
      .then(data => setStats(prev => ({ ...prev, ...data })))
      .catch(err => console.error("Could not load stats.", err));

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => { socket.disconnect(); clearInterval(timeInterval); };
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/cleanup/status`)
      .then(res => {
        if (!res.ok) throw new Error("Error loading cleanup status");
        return res.json();
      })
      .then(data => {
        if (data.needsCleanup) {
          setIsForcedCleanup(true);
          setShowCleanupModal(true);
        }
      })
      .catch(err => console.error("Could not check cleanup status", err));
  }, []);

  const getAdminToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("adminToken");
    if (token) return token;

    const password = prompt("Esta acción requiere privilegios de administrador. Ingresa la contraseña:");
    if (!password) return null;

    try {
      const loginRes = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "centro", password })
      });
      const loginData = await loginRes.json();
      if (loginData.success) {
        localStorage.setItem("adminToken", loginData.token);
        return loginData.token;
      } else {
        alert("Contraseña incorrecta");
        return null;
      }
    } catch {
      alert("Error de conexión al autenticar");
      return null;
    }
  };

  const handleCleanup = async (option: string) => {
    const token = await getAdminToken();
    if (!token) return;

    setIsCleaning(true);
    try {
      const res = await fetch(`${API_URL}/api/cleanup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exportTo: option })
      });
      const data = await res.json();
      if (data.success) {
        if (option === 'download' && data.data) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || 'limpieza_gym_export.json';
          a.click();
          URL.revokeObjectURL(url);
        }
        localStorage.setItem('last_cleanup', new Date().toISOString());
        setShowCleanupModal(false);
        setCleanupOption(null);
        fetch(`${API_URL}/api/stats`)
          .then(r => r.json())
          .then(d => setStats(prev => ({ ...prev, ...d })));
      } else { 
        if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
        alert("Error: " + data.error); 
      }
    } catch { alert("Error conectando con el servidor"); }
    finally { setIsCleaning(false); }
  };

  const handlePostpone = async () => {
    setIsPostponing(true);
    try {
      await fetch(`${API_URL}/api/cleanup/postpone`, { method: 'POST' });
      setShowCleanupModal(false);
      setIsForcedCleanup(false);
    } catch {
      alert("Error al posponer");
    }
    finally { setIsPostponing(false); }
  };

  const cleanupExpired = async () => {
    const token = await getAdminToken();
    if (!token) return;

    setIsCleaningExpired(true);
    setExpiredMessage("");
    try {
      const res = await fetch(`${API_URL}/api/cleanup-expired-members`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setExpiredMessage(data.message);
        fetch(`${API_URL}/api/stats`).then(r => r.json()).then(d => setStats(prev => ({ ...prev, ...d })));
      } else {
        if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
        setExpiredMessage("Error: " + (data.error || "No se pudo completar"));
      }
    } catch {
      setExpiredMessage("Error de conexión");
    }
    setIsCleaningExpired(false);
    setTimeout(() => setExpiredMessage(""), 6000);
  };

  const syncSensor = async () => {
    const token = await getAdminToken();
    if (!token) return;

    setIsSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch(`${API_URL}/api/sync-sensor`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message || "Comando de sincronización enviado");
      } else {
        if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
        setSyncMessage("Error al sincronizar sensor");
      }
    } catch {
      setSyncMessage("Error de conexión");
    }
    setIsSyncing(false);
    setTimeout(() => setSyncMessage(""), 5000);
  };

  const handleOpenDoorClick = () => {
    setShowAdminModal(true);
    setAdminUsername("");
    setAdminPassword("");
    setAdminError("");
  };

  const confirmOpenDoor = async () => {
    if (!adminUsername || !adminPassword) {
      setAdminError("Ingresa usuario y contraseña");
      return;
    }
    
    try {
      const loginRes = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const loginData = await loginRes.json();
      
      if (!loginData.success) {
        setAdminError("Credenciales inválidas");
        return;
      }
      
      setShowAdminModal(false);
      
      const openRes = await fetch(`${API_URL}/api/devices/esp32c6_gimnasio_01/open`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      if(openRes.ok) {
        alert("¡Puerta abierta!");
      } else {
        alert("Error al abrir puerta");
      }
    } catch(e: any) {
      alert("Error: "+ e.message);
    }
  };

  const histogramData = (stats.histogram || Array(24).fill(0)).map((count: number, hour: number) => ({
    hora: `${hour.toString().padStart(2, '0')}:00`,
    ingresos: count,
  }));
  const maxHour = Math.max(...(stats.histogram || [0]), 1);

  const weeklyData = (stats.weekly || []).map((d: WeeklyData) => ({
    label: `${d.day} ${d.date}`,
    ingresos: d.count,
  }));
  const maxWeek = Math.max(...(stats.weekly || []).map((d: WeeklyData) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative glass rounded-3xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-red-800/5 to-black/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Tiempo Real
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-tnt-status-pulse" />
                Sistema Activo
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              <span className="text-gradient">TNT Gym</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Control de acceso biométrico inteligente · Monitoreo en tiempo real · Gestión de membresías
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-white">{mounted ? currentTime.toLocaleTimeString() : '--:--:--'}</p>
              <p className="text-xs text-muted-foreground">{mounted ? currentTime.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Cargando fecha...'}</p>
            </div>
            <button onClick={handleOpenDoorClick} className="group relative px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-800 animate-tnt-gradient-shift" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="relative z-10 w-4 h-4" />
              <span className="relative z-10">Abrir Puerta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 animate-tnt-slide-up stagger-1">
          <AnimatedCounter value={stats.totalAccesses} label="Accesos Hoy" />
        </div>
        <div className="glass rounded-2xl p-5 animate-tnt-slide-up stagger-2">
          <AnimatedCounter value={stats.active} label="Activos" />
        </div>
        <div className="glass rounded-2xl p-5 animate-tnt-slide-up stagger-3">
          <AnimatedCounter value={stats.failedAccesses} label="Fallidos Hoy" />
        </div>
        <div className="glass rounded-2xl p-5 animate-tnt-slide-up stagger-4">
          <AnimatedCounter value={stats.inactive} label="Inactivos" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Accesos Hoy"
          value={stats.totalAccesses}
          icon={Activity}
          gradient="bg-gradient-to-br from-blue-600/20 to-blue-700/10"
          delay="stagger-1"
          onClick={() => router.push('/users?filter=today')}
        />
        <StatCard
          title="Usuarios Activos"
          value={stats.active}
          icon={Users}
          gradient="bg-gradient-to-br from-green-600/20 to-green-700/10"
          delay="stagger-2"
          onClick={() => router.push('/users?filter=active')}
        />
        <StatCard
          title="Usuarios Inactivos"
          value={stats.inactive}
          icon={Flame}
          gradient="bg-gradient-to-br from-red-600/20 to-red-700/10"
          delay="stagger-3"
          onClick={() => router.push('/users?filter=inactive')}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl overflow-hidden animate-tnt-slide-up stagger-3">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Afluencia por Hora</h3>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoy</span>
          </div>
          <div className="p-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240 10% 8%)', border: '1px solid hsl(0 100% 50% / 0.2)', borderRadius: 12, color: '#fff' }}
                  labelFormatter={(label) => `Hora: ${label}`}
                  formatter={(value: number) => [`${value} ingresos`, 'Cantidad']}
                />
                <defs>
                  <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF003C" />
                    <stop offset="100%" stopColor="#FF6B00" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="ingresos"
                  radius={[6, 6, 0, 0]}
                  fill="url(#hourGradient)"
                  onClick={(data) => {
                    const hour = data.hora.split(':')[0];
                    router.push(`/users?filter=access_hour&hour=${hour}`);
                  }}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden animate-tnt-slide-up stagger-4">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-yellow-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Afluencia Semanal</h3>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">7 días</span>
          </div>
          <div className="p-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(240 10% 8%)', border: '1px solid hsl(24 100% 50% / 0.2)', borderRadius: 12, color: '#fff' }}
                  formatter={(value: number) => [`${value} ingresos`, 'Cantidad']}
                />
                <defs>
                  <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF003C" />
                    <stop offset="100%" stopColor="#CC002E" />
                  </linearGradient>
                </defs>
                <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} fill="url(#weekGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Events + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Events */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden animate-tnt-slide-up stagger-5">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center border border-white/10">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Eventos en Vivo</h3>
                <p className="text-[10px] text-muted-foreground">Accesos en tiempo real desde el sensor biométrico</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-tnt-status-pulse" />
              <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">LIVE</span>
            </div>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Esperando eventos del sensor...</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Coloca un dedo en el sensor biométrico para ver el registro aquí</p>
              </div>
            ) : (
              events.map((ev, i) => <EventCard key={ev.id || i} ev={ev} index={i} />)
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 animate-tnt-slide-up stagger-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <button onClick={handleOpenDoorClick} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-800/20 group-hover:from-red-600/30 group-hover:to-red-800/30 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Abrir Puerta</p>
                    <p className="text-[10px] text-muted-foreground">Acceso remoto inmediato</p>
                  </div>
                </div>
              </button>

              <button onClick={() => router.push('/users')} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 group-hover:from-blue-600/30 group-hover:to-cyan-500/30 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Gestionar Usuarios</p>
                    <p className="text-[10px] text-muted-foreground">Renovar o consultar</p>
                  </div>
                </div>
              </button>

              <button onClick={syncSensor} disabled={isSyncing} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-800/20 group-hover:from-red-600/30 group-hover:to-red-800/30 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
                    <RefreshCw className={`w-5 h-5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Sincronizar Sensor</p>
                    <p className="text-[10px] text-muted-foreground">Actualizar lista de usuarios activos</p>
                  </div>
                </div>
              </button>
              {syncMessage && (
                <div className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-muted-foreground text-center">
                  {syncMessage}
                </div>
              )}

              <button onClick={cleanupExpired} disabled={isCleaningExpired} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 group-hover:from-orange-600/30 group-hover:to-red-600/30 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10">
                    <Clock className={`w-5 h-5 text-white ${isCleaningExpired ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Limpiar Expirados (3+ meses)</p>
                    <p className="text-[10px] text-muted-foreground">Eliminar usuarios sin renovar + sensor</p>
                  </div>
                </div>
              </button>
              {expiredMessage && (
                <div className="px-3 py-2 rounded-xl text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 text-center">
                  {expiredMessage}
                </div>
              )}

              <button onClick={() => { setIsForcedCleanup(false); setShowCleanupModal(true); }} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 group-hover:from-orange-600/30 group-hover:to-red-600/30 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Limpieza de Datos</p>
                    <p className="text-[10px] text-muted-foreground">Mantenimiento de base de datos</p>
                  </div>
                </div>
              </button>

              <button onClick={() => router.push('/settings')} className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/[0.02] group-hover:from-white/10 group-hover:to-white/5 transition-all duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shadow-lg border border-white/10">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Configuración</p>
                    <p className="text-[10px] text-muted-foreground">Ajustes del sistema</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sensor Biométrico</span>
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-tnt-status-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Base de Datos</span>
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-tnt-status-pulse" />
                  Conectada
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Servidor MQTT</span>
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-tnt-status-pulse" />
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quincenal Cleanup Modal */}
      {showCleanupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mantenimiento Quincenal</h3>
                  <p className="text-[10px] text-muted-foreground">Limpieza de accesos y usuarios eliminados</p>
                </div>
              </div>
              {!isForcedCleanup && (
                <button onClick={() => setShowCleanupModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {isForcedCleanup
                  ? "Han transcurrido 15 días desde el último mantenimiento. Es necesario realizar la limpieza para evitar la acumulación excesiva de datos. ¿Deseas descargar una copia de seguridad en JSON de los accesos y usuarios eliminados antes de proceder?"
                  : "Se realizará la limpieza completa del historial de accesos diarios y la lista de usuarios eliminados. ¿Deseas descargar una copia antes?"}
              </p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleCleanup('drive')}
                  disabled={isCleaning}
                  className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300 bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-red-500/5"
                >
                  <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/10 border border-white/10">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Guardar en Google Drive</p>
                      <p className="text-[10px] text-muted-foreground">Exportar y subir a la nube</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleCleanup('download')}
                  disabled={isCleaning}
                  className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300 bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-red-500/5"
                >
                  <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/10 border border-white/10">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Descargar a PC / Celular</p>
                      <p className="text-[10px] text-muted-foreground">Descargar archivo JSON</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleCleanup('delete')}
                  disabled={isCleaning}
                  className="w-full group relative p-4 rounded-xl overflow-hidden transition-all duration-300 bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-red-500/5"
                >
                  <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/10 border border-white/10">
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Solo limpiar (sin guardar)</p>
                      <p className="text-[10px] text-muted-foreground">Eliminar registros sin respaldo</p>
                    </div>
                  </div>
                </button>
              </div>

              {isCleaning && (
                <div className="text-center py-2">
                  <div className="w-5 h-5 mx-auto animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  <p className="text-xs text-muted-foreground mt-2">Procesando...</p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handlePostpone}
                  disabled={isPostponing}
                  className="flex-1 py-2 text-sm text-muted-foreground hover:text-white transition-all disabled:opacity-50"
                >
                  {isPostponing ? 'Posponiendo...' : 'Recordar más tarde (6h)'}
                </button>
                {!isForcedCleanup && (
                  <button
                    onClick={() => setShowCleanupModal(false)}
                    className="flex-1 py-2 text-sm text-muted-foreground hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Auth Modal para Abrir Puerta */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={22} /> Seguridad
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresa tus credenciales para autorizar la apertura remota de la puerta.
            </p>
            <div className="space-y-4">
              <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} autoFocus
                placeholder="Usuario"
                className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all" />
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-lg tracking-widest text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && confirmOpenDoor()} />
              {adminError && <p className="text-xs text-red-400 font-medium">{adminError}</p>}
              <button onClick={confirmOpenDoor}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Autorizar Apertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
