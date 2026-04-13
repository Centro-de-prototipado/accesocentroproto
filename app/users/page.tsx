"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCcw, CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";
import { API_URL } from '@/lib/config';

type Member = {
  id: number;
  cedula: string | null;
  nombre: string;
  telefono: string | null;
  huella_id: number;
  estado: string;
  membership_start_date: string;
  membership_end_date: string;
};

export default function UsersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [renewingIds, setRenewingIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = () => {
    fetch(`${API_URL}/api/members`)
      .then((res) => res.json())
      .then((data) => setMembers(data))
      .catch((err) => console.error("Error loading members:", err));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = filteredMembers;
    if (filtered.every(m => selected.has(m.id))) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(m => next.delete(m.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(m => next.add(m.id));
        return next;
      });
    }
  };

  const renewSelected = async () => {
    if (selected.size === 0) return;
    setRenewingIds(new Set(selected));
    
    const promises = Array.from(selected).map((id) =>
      fetch(`${API_URL}/api/members/${id}/renew`, { method: "POST" })
    );

    await Promise.all(promises);
    setMessage(`✅ Mensualidad renovada para ${selected.size} miembro(s). Se contará 1 mes + 2 días de gracia.`);
    setSelected(new Set());
    setRenewingIds(new Set());
    fetchMembers();
    setTimeout(() => setMessage(""), 5000);
  };

  const getStatus = (m: Member) => {
    const now = new Date();
    const end = new Date(m.membership_end_date);
    const grace = new Date(end);
    grace.setDate(grace.getDate() + 2);

    if (now <= end) return { label: "Activo", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 };
    if (now <= grace) return { label: "Gracia", color: "text-yellow-500 bg-yellow-500/10", icon: AlertTriangle };
    return { label: "Vencido", color: "text-red-500 bg-red-500/10", icon: XCircle };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(q) ||
      (m.cedula && m.cedula.includes(q)) ||
      m.huella_id.toString().includes(q) ||
      (m.telefono && m.telefono.includes(q))
    );
  });

  const daysRemaining = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users size={28} /> Miembros Registrados
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Control de membresías y pagos — {members.length} miembro(s) en total
          </p>
        </div>
        <button
          onClick={renewSelected}
          disabled={selected.size === 0}
          className={`px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center gap-2 transition-all ${
            selected.size > 0
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          <RefreshCcw size={18} /> Renovar Mensualidad ({selected.size})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-border bg-card rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          placeholder="Buscar por nombre, cédula, celular o ID de huella..."
        />
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in duration-300">
          {message}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={filteredMembers.length > 0 && filteredMembers.every(m => selected.has(m.id))}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-600 accent-blue-600"
                  />
                </th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Cédula</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Nombre</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Celular</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Huella</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Fecha Ingreso</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Vencimiento</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Días Rest.</th>
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No se encontraron resultados para la búsqueda." : "No hay miembros registrados aún."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const status = getStatus(m);
                  const StatusIcon = status.icon;
                  const days = daysRemaining(m.membership_end_date);
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                        selected.has(m.id) ? "bg-blue-500/5" : ""
                      } ${renewingIds.has(m.id) ? "opacity-50 animate-pulse" : ""}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          className="w-4 h-4 rounded border-slate-600 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{m.id}</td>
                      <td className="px-4 py-4 font-medium">{m.cedula || "—"}</td>
                      <td className="px-4 py-4 font-semibold">{m.nombre}</td>
                      <td className="px-4 py-4">{m.telefono || "—"}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-slate-800 rounded-md text-xs font-mono">#{m.huella_id}</span>
                      </td>
                      <td className="px-4 py-4 text-sm">{formatDate(m.membership_start_date)}</td>
                      <td className="px-4 py-4 text-sm">{formatDate(m.membership_end_date)}</td>
                      <td className="px-4 py-4">
                        <span className={`font-bold text-sm ${days > 5 ? 'text-green-500' : days > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {days > 0 ? `${days}d` : days === 0 ? 'Hoy' : 'Vencido'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
