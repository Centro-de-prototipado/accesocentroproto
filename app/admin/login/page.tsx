"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_URL } from '@/lib/config';

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        router.push("/admin/membresias/nueva");
      } else { setError(data.error || "Login failed"); }
    } catch { setError("Error connecting to server"); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver a Configuración
        </Link>

        <div className="glass rounded-2xl p-8 animate-tnt-explosion">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white text-center">Administrador</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">Acceso al panel de registro</p>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              {error}
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
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-lg shadow-red-500/20 transition-all">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
