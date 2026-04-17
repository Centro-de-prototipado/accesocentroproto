"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, User, CreditCard, Phone, CheckCircle2, ChevronLeft, Loader2, Activity, Calendar } from "lucide-react";
import io from "socket.io-client";
import Link from "next/link";
import { API_URL } from '@/lib/config';

export default function NuevaMembresia() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [basePlanDays, setBasePlanDays] = useState("30");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [huellaId, setHuellaId] = useState<number | null>(null);
  const [isSensorActive, setIsSensorActive] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string>("Inactivo");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Tu ID de dispositivo real
  const DEVICE_ID = "esp32c6_gimnasio_01"; 

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem("adminToken")) {
      router.push("/admin/login");
      return;
    }

    const socket = io(API_URL);

    socket.on("enroll_progress", (data) => {
      console.log("Enrollment progress:", data);
      setIsSensorActive(true);
      if (data.lectura === 1) setEnrollStatus("Mantenga su dedo firme sobre el sensor hasta que el LED confirme la lectura.");
      if (data.lectura === 2) setEnrollStatus("Retire el dedo y vuelva a colocarlo para efectuar la segunda verificación.");
    });

    socket.on("enroll_result", (data) => {
      console.log("Enrollment result:", data);
      if (data.resultado === "exito") {
        setHuellaId(data.huella_id);
        setIsSensorActive(false);
        setEnrollStatus("Completado");
        setError("");
      } else {
        setIsSensorActive(false);
        setEnrollStatus("Inactivo");
        
        switch(data.resultado) {
          case 'timeout': setError("Tiempo de espera agotado. El sensor no detectó el dedo."); break;
          case 'error_coincidencia': setError("Las dos lecturas no coinciden. Intenta de nuevo."); break;
          case 'error_guardado': setError("Error interno guardando la huella en el sensor."); break;
          case 'memoria_llena': setError("La memoria del sensor está llena. No se admiten más huellas."); break;
          default: setError("Error desconocido en el sensor biométrico.");
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const capturarHuella = async () => {
    setError("");
    setHuellaId(null);
    setIsSensorActive(true);
    setEnrollStatus("Obteniendo ID disponible...");

    try {
      // 1. Obtener el siguiente ID disponible (recirculado o nuevo)
      const idRes = await fetch(`${API_URL}/api/next-huella-id`);
      const idData = await idRes.json();
      const nextId = idData.huella_id;

      if (!nextId) throw new Error("No se pudo obtener un ID de huella válido.");

      setEnrollStatus("Despertando sensor...");

      // 2. Iniciar enrolamiento en el sensor con ese ID
      const res = await fetch(`${API_URL}/api/devices/${DEVICE_ID}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ huella_id: nextId })
      });
      
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "No se pudo activar el sensor");
        setIsSensorActive(false);
        setEnrollStatus("Inactivo");
      }
    } catch (err: any) {
      setError(err.message || "Error conectando con el servidor");
      setIsSensorActive(false);
      setEnrollStatus("Inactivo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (huellaId === null) {
      setError("Debes capturar la huella antes de guardar.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, nombre, telefono, huella_id: huellaId, basePlanDays, startDate }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          localStorage.removeItem("adminToken");
          router.push("/settings");
        }, 3000);
      } else {
        setError(data.error || "Error al crear miembro");
      }
    } catch (err) {
      setError("Error conectando con el servidor");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Side - Form */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/settings" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Nuevo Miembro</h1>
              <p className="text-slate-400 mt-1">Registra los datos y captura la huella</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-4 rounded-xl mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <h4 className="font-medium">¡Miembro registrado exitosamente!</h4>
                <p className="text-sm opacity-90">Redirigiendo al inicio...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Cédula</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="1234567890"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="Juan Perez"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Fecha de Inscripción</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Se contará 1 mes + 2 días de gracia a partir de esta fecha.</p>
            </div>

            <button
              type="submit"
              disabled={huellaId === null || isSensorActive || success}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                huellaId !== null 
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              Guardar Miembro
            </button>
          </form>
        </div>

        {/* Right Side - Fingerprint Sensor Card */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-xl">
            {/* Ambient Background glow if scanning */}
            {isSensorActive && (
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            )}

            {isSensorActive && enrollStatus !== "Despertando sensor..." && (
              <div className="absolute top-0 left-0 w-full h-full bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Fingerprint className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Atención!</h3>
                <p className="text-lg text-blue-300 font-medium">{enrollStatus}</p>
                <p className="text-sm text-slate-400 mt-4">Sigue las instrucciones en pantalla para registrar la huella.</p>
              </div>
            )}

            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 z-10 ${
              huellaId !== null 
                ? "bg-emerald-500/20 text-emerald-400" 
                : isSensorActive 
                  ? "bg-blue-500/20 text-blue-400 animate-pulse" 
                  : "bg-slate-800 text-slate-500"
            }`}>
              {huellaId !== null ? (
                <Fingerprint className="w-12 h-12" />
              ) : isSensorActive ? (
                <Activity className="w-12 h-12 animate-bounce" />
              ) : (
                <Fingerprint className="w-12 h-12" />
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2 z-10">Sensor de Huella</h3>
            
            <div className="text-center mb-8 z-10 min-h-[60px]">
              {huellaId !== null ? (
                <p className="text-emerald-400 font-medium">
                  ¡Huella ID #{huellaId} capturada!
                </p>
              ) : isSensorActive ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-blue-400 font-medium">{enrollStatus}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  Vincula la huella biométrica<br/>para permitir el acceso
                </p>
              )}
            </div>

            <button 
              onClick={capturarHuella}
              disabled={isSensorActive || huellaId !== null}
              className={`w-full py-3 rounded-xl font-medium border transition-all z-10 flex items-center justify-center gap-2 ${
                isSensorActive 
                  ? "bg-transparent border-blue-500/50 text-blue-400 cursor-wait" 
                  : huellaId !== null
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              }`}
            >
              {isSensorActive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activando...
                </>
              ) : huellaId !== null ? (
                "Huella Registrada"
              ) : (
                "Capturar Huella"
              )}
            </button>
            
            {huellaId !== null && (
               <button 
                onClick={() => { setHuellaId(null); capturarHuella(); }}
                className="mt-4 text-sm text-slate-500 hover:text-white transition-colors underline z-10"
              >
                Volver a capturar
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
