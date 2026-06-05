"use client";

import { useEffect, useState, Suspense } from "react";
import { Users, RefreshCcw, CheckCircle2, AlertTriangle, XCircle, Search, Trash2, ShieldCheck, X, Loader2, Fingerprint, UserPlus, Clock } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import io from "socket.io-client";
import { API_URL } from '@/lib/config';

type Member = {
  id: number;
  cedula: string | null;
  nombre: string;
  telefono: string | null;
  huella_id: number;
  estado: string;
  rol: string | null;
  fecha_registro: string;
  plan?: { nombre: string; duracion_dias: number; };
};

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Cargando miembros...</p>
        </div>
      </div>
    }>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [renewingIds, setRenewingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'regulares' | 'vip' | 'morosos'>('regulares');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  const [error, setError] = useState("");

  const fetchMembers = () => {
    const filter = searchParams.get('filter');
    const hour = searchParams.get('hour');
    let url = `${API_URL}/api/members`;
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (hour) params.append('hour', hour);
    if (params.toString()) url += `?${params.toString()}`;
    setError("");
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => { console.error(err); setError(`Error de conexión: ${err.message}. Verifica que el backend esté corriendo en ${API_URL}`); });
  };

  useEffect(() => { fetchMembers(); }, [searchParams]);

  useEffect(() => {
    const socket = io(API_URL);
    socket.on('member_deleted_confirm', (data: { id: number, huella_id: number }) => {
      setMembers((prev) => prev.filter(m => m.id !== data.id));
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(data.id); return next; });
      setMessage(`Usuario #${data.huella_id} eliminado (confirmado por sensor).`);
      setTimeout(() => setMessage(""), 5000);
    });
    return () => { socket.disconnect(); };
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleAll = () => {
    const filtered = filteredMembers;
    if (filtered.every(m => selected.has(m.id))) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(m => next.delete(m.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(m => next.add(m.id)); return next; });
    }
  };

  const handleRenewClick = () => {
    if (selected.size === 0) return;
    setShowAdminModal(true);
    setAdminPass("");
    setAdminError("");
  };

  const confirmRenewal = async () => {
    setAdminError("");
    try {
      const loginRes = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "centro", password: adminPass })
      });
      const loginData = await loginRes.json();
      if (!loginData.success) {
        setAdminError(loginData.error || "Contraseña incorrecta");
        return;
      }

      const token = loginData.token;
      localStorage.setItem("adminToken", token);

      const ids = Array.from(selected);
      setRenewingIds(new Set(ids));
      setShowAdminModal(false);
      setAdminPass("");

      await Promise.all(
        ids.map((id) =>
          fetch(`${API_URL}/api/members/${id}/renew`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })
        )
      );
      setMessage(`Mensualidad renovada exitosamente para ${ids.length} miembro(s).`);
    } catch {
      setMessage("Error al renovar. Intenta de nuevo.");
    }
    setSelected(new Set());
    setRenewingIds(new Set());
    fetchMembers();
    setTimeout(() => setMessage(""), 5000);
  };

  const deleteMember = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este miembro?")) return;
    setDeletingIds(prev => new Set(prev).add(id));
    
    let token = localStorage.getItem("adminToken");
    if (!token) {
      const password = prompt("Esta acción requiere privilegios de administrador. Ingresa la contraseña:");
      if (!password) {
        setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        return;
      }
      try {
        const loginRes = await fetch(`${API_URL}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "centro", password })
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          token = loginData.token;
          localStorage.setItem("adminToken", token as string);
        } else {
          alert("Contraseña incorrecta");
          setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
          return;
        }
      } catch {
        alert("Error de conexión al autenticar");
        setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("adminToken");
          alert("Sesión expirada o no autorizada. Por favor, reintenta e ingresa la contraseña.");
        } else {
          alert("Error: " + data.error);
        }
        setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      }
    } catch {
      alert("Error conectando con el servidor");
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const getStatus = (m: Member) => {
    if (m.estado === 'activo') return { label: "Activo", color: "from-green-500/20 to-green-600/10 text-green-400 border-green-500/20", icon: CheckCircle2 };
    return { label: "Renovar Mensualidad", color: "from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/20", icon: AlertTriangle };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

  const getExpirationDate = (m: Member) => {
    if (m.rol === 'vip') return "VIP (No vence)";
    const duracionDias = m.plan?.duracion_dias || 30;
    
    const expDate = new Date(m.fecha_registro);
    expDate.setDate(expDate.getDate() + duracionDias);

    // 2 días de gracia para pagar
    const corteDate = new Date(expDate);
    corteDate.setDate(corteDate.getDate() + 2);
    
    const now = new Date();
    
    if (now > corteDate) {
      return (
        <span className="text-red-400 font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Vencido ({formatDate(expDate.toISOString())})
        </span>
      );
    } else if (now > expDate) {
      return (
        <span className="text-yellow-400 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> Gracia hasta {formatDate(corteDate.toISOString())}
        </span>
      );
    }
    return formatDate(expDate.toISOString());
  };

  const filteredMembers = members.filter(m => {
    // Filter by tab
    if (activeTab === 'regulares' && (m.rol === 'vip' || m.estado !== 'activo')) return false;
    if (activeTab === 'vip' && m.rol !== 'vip') return false;
    if (activeTab === 'morosos' && m.estado === 'activo') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.nombre.toLowerCase().includes(q) && !(m.cedula && m.cedula.includes(q)) && !m.huella_id.toString().includes(q) && !(m.telefono && m.telefono.includes(q))) return false;
    }
    const filter = searchParams.get('filter');
    if (filter === 'active') return m.estado === 'activo';
    if (filter === 'inactive') return m.estado !== 'activo';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 animate-tnt-slide-up stagger-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Miembros</h2>
                <p className="text-xs text-muted-foreground">{members.length} miembro(s) registrados</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/membresias/nueva')} className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 transition-all">
              <UserPlus className="w-4 h-4" /> Nuevo Miembro
            </button>
            {activeTab !== 'vip' && (
              <button onClick={handleRenewClick} disabled={selected.size === 0} className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                selected.size > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:from-green-500 hover:to-emerald-500' : 'bg-white/5 text-muted-foreground cursor-not-allowed'
              }`}>
                <RefreshCcw className="w-4 h-4" /> Renovar ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('regulares'); setSelected(new Set()); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === 'regulares' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            Miembros Activos
          </button>
          <button
            onClick={() => { setActiveTab('morosos'); setSelected(new Set()); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === 'morosos' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            Renovar Mensualidad
          </button>
          <button
            onClick={() => { setActiveTab('vip'); setSelected(new Set()); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'vip' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <ShieldCheck className="w-4 h-4" /> VIP / Staff
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
            placeholder="Buscar por nombre, cédula, celular o huella..." />
        </div>

        {message && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400 animate-tnt-slide-up">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 animate-tnt-slide-up">
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-tnt-slide-up stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-4 text-left">
                  <input type="checkbox" checked={filteredMembers.length > 0 && filteredMembers.every(m => selected.has(m.id))} onChange={toggleAll}
                    className="w-4 h-4 rounded border-white/20 accent-red-500 bg-transparent" />
                </th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Miembro</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Cédula</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Contacto</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Huella</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Inicio</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Vence</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Estado</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    {searchQuery ? "Sin resultados para la búsqueda." : "No hay miembros registrados."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                  const status = getStatus(m);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={m.id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors animate-tnt-slide-left ${renewingIds.has(m.id) ? 'opacity-50 animate-pulse' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)}
                          className="w-4 h-4 rounded border-white/20 accent-red-500 bg-transparent" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{m.nombre}</p>
                          {m.rol === 'vip' && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">VIP</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">ID #{m.id}</p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">{m.cedula || "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">{m.telefono || "—"}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-muted-foreground text-[10px] font-mono">
                          <Fingerprint className="w-3 h-3" /> #{m.huella_id}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs hidden lg:table-cell">{formatDate(m.fecha_registro)}</td>
                      <td className="px-4 py-4 text-muted-foreground text-xs hidden lg:table-cell">
                        {getExpirationDate(m)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => deleteMember(m.id)} disabled={deletingIds.has(m.id)}
                          className={`p-2 rounded-lg transition-all ${deletingIds.has(m.id) ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-400'}`}>
                          {deletingIds.has(m.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Auth Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={22} /> Acceso Admin
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ingresa la contraseña de administrador para renovar {selected.size} miembro(s).
            </p>
            <div className="space-y-4">
              <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoFocus
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background/50 border border-white/10 rounded-xl text-lg tracking-widest text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && confirmRenewal()} />
              {adminError && <p className="text-xs text-red-400 font-medium">{adminError}</p>}
              <button onClick={confirmRenewal}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 transition-all">
                Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
