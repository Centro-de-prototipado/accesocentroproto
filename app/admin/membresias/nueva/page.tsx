"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, User, CreditCard, Phone, CheckCircle2, ChevronLeft, Loader2, Activity, Calendar, Sparkles } from "lucide-react";
import io from "socket.io-client";
import Link from "next/link";
import { API_URL } from '@/lib/config';

export default function NuevaMembresia() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [rol, setRol] = useState("miembro");
  const [huellaId, setHuellaId] = useState<number | null>(null);
  const [isSensorActive, setIsSensorActive] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string>("Inactivo");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const DEVICE_ID = "esp32c6_gimnasio_01";

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) { router.push("/admin/login"); return; }

    const socket = io(API_URL);
    socket.on("enroll_progress", (data) => {
      setIsSensorActive(true);
      if (data.lectura === 1) setEnrollStatus("Mantén el dedo firme sobre el sensor...");
      if (data.lectura === 2) setEnrollStatus("Retira el dedo y vuelve a colocarlo para verificar.");
    });
    socket.on("enroll_result", (data) => {
      if (data.resultado === "exito") {
        setHuellaId(data.huella_id);
        setIsSensorActive(false);
        setEnrollStatus("Completado");
        setError("");
      } else {
        setIsSensorActive(false);
        setEnrollStatus("Inactivo");
        const errors: Record<string, string> = {
          timeout: "Tiempo agotado. El sensor no detectó el dedo.",
          error_coincidencia: "Las dos lecturas no coinciden. Intenta de nuevo.",
          error_guardado: "Error interno guardando la huella en el sensor.",
          memoria_llena: "La memoria del sensor está llena.",
        };
        setError(errors[data.resultado] || "Error desconocido en el sensor.");
      }
    });
    return () => { socket.disconnect(); };
  }, [router]);

  const capturarHuella = async () => {
    setError(""); setHuellaId(null); setIsSensorActive(true);
    setEnrollStatus("Obteniendo ID disponible...");
    const token = localStorage.getItem("adminToken");
    if (!token) { setError("Debes iniciar sesión como administrador."); setIsSensorActive(false); setEnrollStatus("Inactivo"); return; }
    try {
      const idRes = await fetch(`${API_URL}/api/next-huella-id`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (idRes.status === 401 || idRes.status === 403) {
        setError("Sesión expirada. Vuelve a iniciar sesión.");
        localStorage.removeItem("adminToken");
        setIsSensorActive(false); setEnrollStatus("Inactivo");
        return;
      }
      const idData = await idRes.json();
      const nextId = idData.huella_id;
      if (!nextId) throw new Error("No se pudo obtener un ID de huella.");
      setEnrollStatus("Despertando sensor...");
      const res = await fetch(`${API_URL}/api/devices/${DEVICE_ID}/enroll`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ huella_id: nextId })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "No se pudo activar el sensor");
        setIsSensorActive(false); setEnrollStatus("Inactivo");
      }
    } catch (err: any) {
      setError(err.message || "Error conectando con el servidor");
      setIsSensorActive(false); setEnrollStatus("Inactivo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (huellaId === null) { setError("Debes capturar la huella antes de guardar."); return; }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cedula, nombre, telefono, huella_id: huellaId, rol, fecha_registro: fechaRegistro }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => { localStorage.removeItem("adminToken"); router.push("/settings"); }, 3000);
      } else { setError(data.error || "Error al crear miembro"); }
    } catch { setError("Error conectando con el servidor"); }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Left - Form */}
      <div className="flex-1 glass rounded-2xl p-6 md:p-8 animate-tnt-slide-up stagger-1">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Nuevo Miembro</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Registra los datos y captura la huella</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-4 rounded-xl mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <h4 className="font-semibold text-green-400">¡Miembro registrado!</h4>
              <p className="text-xs text-green-400/70">Redirigiendo...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cédula</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="1234567890" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="Juan Perez" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white placeholder-muted-foreground focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="3001234567" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tipo de Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select value={rol} onChange={(e) => setRol(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none cursor-pointer">
                <option value="miembro" className="bg-[#1a1a1a]">Miembro Regular (Requiere Pago)</option>
                <option value="vip" className="bg-[#1a1a1a]">VIP / Staff (No requiere Pago)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fecha de Ingreso</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input type="date" value={fechaRegistro} onChange={(e) => setFechaRegistro(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-background/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                required />
            </div>
          </div>

          <button type="submit" disabled={huellaId === null || isSensorActive || success}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
              huellaId !== null
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-muted-foreground cursor-not-allowed'
            }`}>
            Guardar Miembro
          </button>
        </form>
      </div>

      {/* Right - Sensor Card */}
      <div className="w-full md:w-80">
        <div className="glass rounded-2xl p-8 flex flex-col items-center min-h-[350px] relative overflow-hidden animate-tnt-slide-up stagger-2">
          {isSensorActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 animate-pulse" />
          )}

          {isSensorActive && enrollStatus !== "Despertando sensor..." && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                <Fingerprint className="w-10 h-10 text-white animate-tnt-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Escaneando...</h3>
              <p className="text-sm text-blue-300 font-medium">{enrollStatus}</p>
              <div className="flex gap-1.5 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-tnt-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>
          )}

          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 z-10 shadow-lg ${
            huellaId !== null
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30'
              : isSensorActive
                ? 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-blue-500/30 animate-tnt-pulse'
                : 'bg-white/5'
          }`}>
            {huellaId !== null ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
            ) : isSensorActive ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Fingerprint className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-1 z-10">Sensor Biométrico</h3>

          <div className="text-center mb-6 z-10 min-h-[50px]">
            {huellaId !== null ? (
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <p className="text-green-400 font-semibold text-sm">Huella #{huellaId} capturada</p>
              </div>
            ) : isSensorActive ? (
              <p className="text-blue-300 font-medium text-sm">{enrollStatus}</p>
            ) : (
              <p className="text-muted-foreground text-xs">Vincula la huella biométrica<br/>para permitir el acceso</p>
            )}
          </div>

              <button onClick={capturarHuella} disabled={isSensorActive || huellaId !== null}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all z-10 flex items-center justify-center gap-2 ${
                  isSensorActive
                    ? 'bg-transparent border border-blue-500/30 text-blue-400 cursor-wait'
                    : huellaId !== null
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white shadow-lg shadow-red-500/20 border border-white/10'
                }`}>
            {isSensorActive ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Escaneando...</>
            ) : huellaId !== null ? (
              <><CheckCircle2 className="w-4 h-4" /> Huella Registrada</>
            ) : (
              <><Fingerprint className="w-4 h-4" /> Capturar Huella</>
            )}
          </button>

          {huellaId !== null && (
            <button onClick={() => { setHuellaId(null); capturarHuella(); }}
              className="mt-3 text-[10px] text-muted-foreground hover:text-white transition-colors underline z-10">
              Volver a capturar
            </button>
          )}

          {/* Decorative */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${
                huellaId !== null ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-full' :
                isSensorActive ? 'bg-gradient-to-r from-blue-500 to-cyan-500 w-2/3 animate-tnt-shimmer' : 'w-0'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
