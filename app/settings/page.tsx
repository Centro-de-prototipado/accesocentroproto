"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, UserPlus, Trash2, Settings, LogOut, Search, ShieldCheck, Fingerprint, ArrowLeft, Loader2, Download, Cloud, Smartphone, X, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { API_URL } from '@/lib/config';
import io from "socket.io-client";

type Member = {
  id: number;
  cedula: string | null;
  nombre: string;
  telefono: string | null;
  huella_id: number;
};

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isPostponing, setIsPostponing] = useState(false);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);
  const [expiredResult, setExpiredResult] = useState<number | null>(null);
  const [expiredError, setExpiredError] = useState("");

  const getAdminToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("adminToken");
    if (token) return token;

    const password = prompt("Esta acción requiere privilegios de administrador. Ingresa la contraseña:");
    if (!password) return null;

    try {
      const loginRes = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "tntgym", password })
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
        setMessage("Limpieza de base de datos realizada con éxito (accesos y usuarios eliminados).");
        setShowCleanupModal(false);
        loadMembers();
        setTimeout(() => setMessage(""), 5000);
      } else { 
        if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
        setMessage("Error: " + data.error); 
      }
    } catch { setMessage("Error conectando con el servidor"); }
    finally { setIsCleaning(false); }
  };

  const handlePostpone = async () => {
    const token = await getAdminToken();
    if (!token) return;
    setIsPostponing(true);
    try {
      const res = await fetch(`${API_URL}/api/cleanup/postpone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setShowCleanupModal(false);
      else if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
    } catch { setMessage("Error al posponer"); }
    finally { setIsPostponing(false); }
  };

  const loadMembers = () => {
    fetch(`${API_URL}/api/members`)
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        setIsAuthenticated(true);
        loadMembers();
      } else {
        setLoginError(data.error || "Credenciales inválidas");
      }
    } catch { setLoginError("Error conectando al servidor"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setUsername(""); setPassword("");
  };

  const handleCleanupExpired = async () => {
    if (!confirm("¿Eliminar todos los usuarios con más de 3 meses sin renovar? Esta acción liberará espacio en el sensor biométrico.")) return;
    const token = await getAdminToken();
    if (!token) return;
    setIsCleaningExpired(true);
    setExpiredResult(null);
    setExpiredError("");
    try {
      const res = await fetch(`${API_URL}/api/cleanup-expired-members`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setExpiredResult(data.deleted);
        setMessage(data.message);
        loadMembers();
        setTimeout(() => setMessage(""), 5000);
      } else {
        if (res.status === 401 || res.status === 403) handleLogout();
        setExpiredResult(-1);
        setExpiredError(data.error || "Error al limpiar");
      }
    } catch {
      setExpiredResult(-1);
      setExpiredError("Error de conexión");
    }
    finally { setIsCleaningExpired(false); }
  };

  const handleDelete = async (id: number) => {
    const token = await getAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Usuario eliminado correctamente.");
        setDeleteConfirm(null);
        loadMembers();
        setTimeout(() => setMessage(""), 4000);
      } else { 
        if (res.status === 401 || res.status === 403) handleLogout();
        setMessage("Error: " + (data.error || "No se pudo eliminar")); 
      }
    } catch { setMessage("Error conectando con el servidor"); }
  };

  const filteredMembers = members.filter(m =>
    m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.cedula && m.cedula.includes(searchQuery)) ||
    m.huella_id.toString().includes(searchQuery)
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 animate-tnt-explosion">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white text-center">Administrador</h2>
            <p className="text-muted-foreground text-center text-sm mb-8">Ingresa tus credenciales</p>

            {loginError && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="centro" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white shadow-lg shadow-red-500/20 transition-all border border-white/10">
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 animate-tnt-slide-up stagger-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Configuración</h2>
              <p className="text-xs text-muted-foreground">Administración del sistema</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>

        {message && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400 animate-tnt-slide-up">
            {message}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/membresias/nueva"
          className="glass rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300 group animate-tnt-slide-up stagger-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Añadir Usuario</h3>
          <p className="text-sm text-muted-foreground">Registra un nuevo usuario con sus datos y captura su huella biométrica en el sensor.</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-400">
            Ir al registro <ArrowLeft className="w-3 h-3 rotate-180" />
          </div>
        </Link>

        <div className="glass rounded-2xl p-6 animate-tnt-slide-up stagger-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Eliminar Usuario</h3>
          <p className="text-sm text-muted-foreground mb-4">Busca y da de baja un usuario del sistema.</p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="Buscar usuario..." />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{searchQuery ? "Sin resultados" : "No hay usuarios"}</p>
            ) : (
              filteredMembers.map((m, idx) => (
                <div key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all animate-tnt-slide-left"
                  style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <Fingerprint className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{m.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">#{m.huella_id} · {m.cedula || "—"}</p>
                    </div>
                  </div>
                  {deleteConfirm === m.id ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleDelete(m.id)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 transition-all">
                        Confirmar
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 text-muted-foreground hover:text-white transition-all">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(m.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300 group animate-tnt-slide-up stagger-3 cursor-pointer flex flex-col justify-between"
          onClick={() => setShowCleanupModal(true)}>
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Limpieza de Datos</h3>
            <p className="text-sm text-muted-foreground">Limpia el historial de accesos diarios y la lista de miembros eliminados para optimizar el almacenamiento.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-400">
            Iniciar mantenimiento <ArrowLeft className="w-3 h-3 rotate-180" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-orange-500/10 animate-tnt-slide-up stagger-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Limpiar Usuarios Expirados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Elimina usuarios con más de 3 meses sin renovar su mensualidad. También libera espacio en la memoria del sensor biométrico enviando los IDs de huella a borrar.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleCleanupExpired}
              disabled={isCleaningExpired}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/20 transition-all border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCleaningExpired ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isCleaningExpired ? 'Eliminando...' : 'Eliminar Expirados'}
            </button>
            {expiredResult !== null && expiredResult >= 0 && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400">
                Se eliminaron {expiredResult} usuario(s) expirados y se enviaron comandos de borrado al sensor.
              </div>
            )}
            {expiredResult !== null && expiredResult < 0 && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400">
                Error: {expiredError}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* System Info */}
      <div className="glass rounded-2xl p-6 animate-tnt-slide-up stagger-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Información del Sistema</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Usuarios Totales", value: members.length, color: "from-blue-600/20 to-blue-700/10 text-blue-400" },
            { label: "Huellas Registradas", value: members.filter(m => m.huella_id).length, color: "from-green-600/20 to-green-700/10 text-green-400" },
            { label: "Versión Sistema", value: "v2.0", color: "from-yellow-600/20 to-yellow-700/10 text-yellow-400" },
            { label: "Estado", value: "Operacional", color: "from-green-600/20 to-green-700/10 text-green-400" },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl p-4 bg-gradient-to-br ${item.color} border border-white/5`}>
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xl font-black text-white">{item.value}</p>
            </div>
          ))}
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
              <button onClick={() => setShowCleanupModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Se realizará la limpieza completa del historial de accesos diarios y la lista de usuarios eliminados. ¿Deseas descargar una copia antes?
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
                <button
                  onClick={() => setShowCleanupModal(false)}
                  className="flex-1 py-2 text-sm text-muted-foreground hover:text-white transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
