"use client";

import { useEffect, useState, useRef } from "react";
import { History, ShieldCheck, ShieldAlert, Clock, Search, ChevronLeft, ChevronRight, Download, Filter, X, Calendar, Fingerprint, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { API_URL } from '@/lib/config';

type AccessLog = {
  id: number;
  resultado: string;
  confianza: number;
  timestamp: string;
  dispositivo_id: string;
  miembro?: { nombre: string; huella_id: number; id: number } | null;
  dispositivo?: { nombre: string };
};

type WeeklyDay = {
  day: string;
  date: string;
  total: number;
  permitidos: number;
  denegados: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

function LogCard({ log, index }: { log: AccessLog; index: number }) {
  const isPermitted = log.resultado === 'permitido';
  const isGrace = log.resultado === 'permitido_gracia';
  const isExpired = log.resultado === 'denegado_vencido';
  const isMoroso = log.resultado === 'moroso';
  const isDenied = log.resultado === 'denegado';

  const getConfig = () => {
    if (isPermitted) return { border: 'border-green-500/20', bg: 'bg-green-500/10', text: 'text-green-400', badge: 'PERMITIDO', badgeColor: 'bg-green-500/20 text-green-400', dot: 'bg-green-500' };
    if (isGrace) return { border: 'border-yellow-500/20', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'GRACIA', badgeColor: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' };
    if (isExpired) return { border: 'border-orange-500/20', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'VENCIDO', badgeColor: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-500' };
    if (isMoroso) return { border: 'border-orange-500/20', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'MOROSO', badgeColor: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-500' };
    return { border: 'border-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'DENEGADO', badgeColor: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' };
  };

  const cfg = getConfig();

  return (
    <div
      className={`relative glass rounded-xl p-4 border ${cfg.border} transition-all duration-300 hover:border-white/10 group`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center ${cfg.text} shrink-0`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm truncate">
                {log.miembro?.nombre || 'Huella Desconocida'}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badgeColor} shrink-0`}>
                {cfg.badge}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
              {log.miembro && (
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3" /> #{log.miembro.huella_id}
                </span>
              )}
              <span>Confianza: {log.confianza}%</span>
              <span className="hidden sm:inline">{log.dispositivo_id}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-white">{new Date(log.timestamp).toLocaleTimeString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.timestamp).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [daysFilter, setDaysFilter] = useState(7);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/logs?limit=50&page=${page}`;
      if (startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
      } else {
        url += `&days=${daysFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.logs) {
        let filtered = data.logs;
        if (filterResult !== 'all') {
          filtered = filtered.filter((l: AccessLog) => l.resultado === filterResult);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((l: AccessLog) =>
            l.miembro?.nombre?.toLowerCase().includes(q) ||
            l.miembro?.huella_id?.toString().includes(q)
          );
        }
        setLogs(filtered);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Error fetching logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekly = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs/weekly?days=${daysFilter}`);
      const data = await res.json();
      setWeekly(data || []);
    } catch (e) {
      console.error("Error fetching weekly:", e);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    fetchWeekly();
  }, [daysFilter, startDate, endDate]);

  useEffect(() => {
    if (filterResult !== 'all' || searchQuery) {
      fetchLogs(1);
    }
  }, [filterResult, searchQuery]);

  const filteredLogs = logs.filter(l => {
    if (filterResult !== 'all' && l.resultado !== filterResult) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.miembro?.nombre?.toLowerCase().includes(q) ||
        l.miembro?.huella_id?.toString().includes(q);
    }
    return true;
  });

  const handleExport = () => {
    const exportData = filteredLogs.map(l => ({
      fecha: new Date(l.timestamp).toLocaleString('es-CO'),
      miembro: l.miembro?.nombre || 'Desconocido',
      huella_id: l.miembro?.huella_id || '-',
      resultado: l.resultado,
      confianza: l.confianza,
      dispositivo: l.dispositivo_id,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_accesos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterResult("all");
    setStartDate("");
    setEndDate("");
    setDaysFilter(7);
  };

  const stats = {
    total: pagination.total,
    permitidos: filteredLogs.filter(l => l.resultado === 'permitido').length,
    denegados: filteredLogs.filter(l => !l.resultado.includes('permitido')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 animate-tnt-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Historial de Accesos</h2>
              <p className="text-xs text-muted-foreground">Registro completo de eventos biométricos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-red-600/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10'}`}>
              <Filter className="w-3.5 h-3.5" /> Filtros
            </button>
            <button onClick={handleExport}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-tnt-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Nombre o huella ID..." />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Resultado</label>
                <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all">
                  <option value="all">Todos</option>
                  <option value="permitido">Permitido</option>
                  <option value="permitido_gracia">Gracia</option>
                  <option value="denegado">Denegado</option>
                  <option value="denegado_vencido">Vencido</option>
                  <option value="moroso">Moroso</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Fecha inicio</label>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDaysFilter(0); }}
                  className="w-full px-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">Fecha fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all [color-scheme:dark]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[7, 15, 30].map(d => (
                  <button key={d} onClick={() => { setDaysFilter(d); setStartDate(""); setEndDate(""); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${daysFilter === d ? 'bg-red-600/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-muted-foreground hover:text-white border border-white/5'}`}>
                    Últimos {d} días
                  </button>
                ))}
              </div>
              <button onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Registros', value: stats.total, color: 'from-white/10 to-white/5', textColor: 'text-white' },
          { label: 'Permitidos', value: stats.permitidos, color: 'from-green-600/20 to-green-700/10', textColor: 'text-green-400' },
          { label: 'Denegados', value: stats.denegados, color: 'from-red-600/20 to-red-700/10', textColor: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className={`glass rounded-2xl p-4 bg-gradient-to-br ${s.color} animate-tnt-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-black ${s.textColor} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      {weekly.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden animate-tnt-slide-up">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Accesos por día</h3>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{daysFilter} días</span>
          </div>
          <div className="p-4" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid hsl(0 100% 45% / 0.3)', borderRadius: 12, color: '#fff' }}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <defs>
                  <linearGradient id="permGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                  <linearGradient id="denGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
                <Bar dataKey="permitidos" radius={[4, 4, 0, 0]} fill="url(#permGradient)" name="Permitidos" stackId="a" />
                <Bar dataKey="denegados" radius={[4, 4, 0, 0]} fill="url(#denGradient)" name="Denegados" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="glass rounded-2xl overflow-hidden animate-tnt-slide-up">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-white">Registros</h3>
            <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{filteredLogs.length} resultados</span>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => fetchLogs(pagination.page + 1)} disabled={!pagination.hasMore}
                className="p-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-white disabled:opacity-30 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center border border-white/5">
                <Clock className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Cargando historial...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600/10 to-red-800/10 flex items-center justify-center border border-white/5">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No hay registros de acceso</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Los eventos del sensor biométrico aparecerán aquí</p>
            </div>
          ) : (
            filteredLogs.map((log, i) => (
              <LogCard key={log.id} log={log} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
