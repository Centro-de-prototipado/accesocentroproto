"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, UserPlus, Trash2, Settings, LogOut, Search } from "lucide-react";
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

  // Delete section state
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
      .then((data) => setMembers(data))
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
    } catch {
      setLoginError("Error conectando al servidor");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Miembro eliminado correctamente.");
        setDeleteConfirm(null);
        loadMembers();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage("❌ Error: " + (data.error || "No se pudo eliminar"));
      }
    } catch {
      setMessage("❌ Error conectando con el servidor");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.cedula && m.cedula.includes(searchQuery)) ||
      m.huella_id.toString().includes(searchQuery)
  );

  // ── LOGIN SCREEN ────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">Administrador</h2>
          <p className="text-muted-foreground text-center mb-8">Ingresa tus credenciales para continuar</p>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-border bg-background rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="centro"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-border bg-background rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── SETTINGS DASHBOARD ──────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings size={28} /> Configuración
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Administración de miembros del gimnasio</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in duration-300">
          {message}
        </div>
      )}

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Member Card */}
        <Link
          href="/admin/membresias/nueva"
          className="bg-card border border-border rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-pointer block"
        >
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <UserPlus size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Añadir Miembro</h3>
          <p className="text-muted-foreground text-sm">
            Registra un nuevo miembro con sus datos personales y captura su huella biométrica en el sensor.
          </p>
        </Link>

        {/* Delete Member Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-5">
            <Trash2 size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Eliminar Miembro</h3>
          <p className="text-muted-foreground text-sm mb-5">
            Busca por nombre, cédula o ID de huella para dar de baja un miembro.
          </p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border bg-background rounded-lg text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="Buscar miembro..."
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                {searchQuery ? "Sin resultados" : "No hay miembros"}
              </p>
            ) : (
              filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-sm">{m.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      CC: {m.cedula || "—"} · Huella #{m.huella_id}
                    </p>
                  </div>
                  {deleteConfirm === m.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(m.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
