import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import './globals.css';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, Activity } from 'lucide-react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Centro Prototipado — Control de Acceso',
  description: 'Sistema inteligente de gestión de accesos biométricos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased overflow-x-hidden">
        <div className="flex min-h-screen bg-[#05070a]">

          {/* Sidebar Premium */}
          <aside className="w-72 bg-[#0a0d14]/80 backdrop-blur-2xl border-r border-white/5 hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-50">
            <div className="h-28 flex items-center px-8">
              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500 overflow-hidden p-0.5 ring-1 ring-white/10">
                  <Image src="/logo-centro.jpeg" alt="Centro Prototipado" width={52} height={52} className="object-contain rounded-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter leading-none flex flex-col">
                    <span className="text-white">CENTRO</span>
                    <span className="text-cyan-400 text-xs tracking-[0.3em] font-bold">PROTOTIPADO</span>
                  </h1>
                </div>
              </div>
            </div>

            <nav className="p-6 space-y-2 flex-1">
              {[
                { href: '/', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/users', label: 'Gestión Personal', icon: Users },
                { href: '/admin', label: 'Admin', icon: Settings },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300 group"
                >
                  <link.icon size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-6 mt-auto">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl -mr-12 -mt-12 group-hover:bg-cyan-500/20 transition-colors" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">Core Online</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Centro Prototipado — v2.5
                </p>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0 flex flex-col relative">
            
            {/* Header móvil */}
            <header className="h-20 flex items-center justify-between px-6 bg-[#0a0d14]/80 backdrop-blur-md border-b border-white/5 lg:hidden sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden p-0.5 ring-1 ring-white/10">
                  <Image src="/logo-centro.jpeg" alt="Centro Prototipado" width={36} height={36} className="object-contain rounded-lg" />
                </div>
                <h1 className="text-lg font-black tracking-tighter text-white">CENTRO PROTOTIPADO</h1>
              </div>
              <button className="p-2 rounded-xl bg-white/5 text-white">
                <LayoutDashboard size={20} />
              </button>
            </header>

            {/* Viewport de contenido */}
            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full pb-32 lg:pb-10">
              {children}
            </div>

            {/* Navegación móvil inferior */}
            <nav className="fixed bottom-6 left-6 right-6 z-50 bg-[#12161f]/90 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-around p-3 lg:hidden shadow-2xl shadow-black">
              <Link href="/" className="p-3 text-cyan-400"><LayoutDashboard size={24} /></Link>
              <Link href="/users" className="p-3 text-slate-400"><Users size={24} /></Link>
              <Link href="/admin" className="p-3 text-slate-400"><Settings size={24} /></Link>
            </nav>
          </main>
        </div>
      </body>
    </html>
  );
}
