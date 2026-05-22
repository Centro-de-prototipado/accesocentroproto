"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, UserPlus, Trash2, Settings, LogOut, Search, ShieldCheck, Fingerprint, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { API_URL } from '@/lib/config';

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

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      setIsAuthenticated(true);
      loadMembers();
    }
  }, []);

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

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage("Miembro eliminado correctamente.");
        setDeleteConfirm(null);
        loadMembers();
        setTimeout(() => setMessage(""), 4000);
      } else { setMessage("Error: " + (data.error || "No se pudo eliminar")); }
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
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/admin/membresias/nueva"
          className="glass rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300 group animate-tnt-slide-up stagger-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Añadir Miembro</h3>
          <p className="text-sm text-muted-foreground">Registra un nuevo miembro con sus datos y captura su huella biométrica en el sensor.</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-400">
            Ir al registro <ArrowLeft className="w-3 h-3 rotate-180" />
          </div>
        </Link>

        <div className="glass rounded-2xl p-6 animate-tnt-slide-up stagger-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Eliminar Miembro</h3>
          <p className="text-sm text-muted-foreground mb-4">Busca y da de baja un miembro del sistema.</p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="Buscar miembro..." />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">{searchQuery ? "Sin resultados" : "No hay miembros"}</p>
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
            { label: "Miembros Totales", value: members.length, color: "from-blue-600/20 to-blue-700/10 text-blue-400" },
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
    </div>
  );
}
