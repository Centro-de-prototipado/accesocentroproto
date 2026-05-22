import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Outfit } from 'next/font/google';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'TNT Gym — Control de Acceso Biométrico',
  description: 'Sistema de acceso biométrico para gimnasios con monitoreo en tiempo real',
};

function TNTLogo({ small = false }: { small?: boolean }) {
  return (
    <div className={`relative inline-flex items-center gap-1.5 ${small ? 'scale-75' : ''}`}>
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-red-900 rounded-full blur-xl opacity-50 animate-tnt-pulse" />
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-black text-sm shadow-lg shadow-red-500/25 border border-white/10">
          T
        </div>
      </div>
      <div className="relative">
        <span className="text-xl font-black tracking-tight">
          <span className="text-gradient">TNT</span>
        </span>
        <span className="text-xs font-medium text-muted-foreground ml-0.5 align-baseline">GYM</span>
      </div>
    </div>
  );
}

function NavItem({ href, label, isActive }: { href: string; label: string; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
        isActive
          ? 'text-white bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/20'
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-red-600 to-red-800 shadow-lg shadow-red-500/50" />
      )}
      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
        isActive ? 'bg-gradient-to-r from-red-500 to-red-700 shadow-lg shadow-red-500/50' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/60'
      }`} />
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={outfit.className}>
        <div className="flex min-h-screen">
          {/* Animated background particles */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-20 left-10 w-1 h-1 bg-red-500/30 rounded-full animate-tnt-particle" style={{ animationDelay: '0s', animationDuration: '12s' }} />
            <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-orange-400/20 rounded-full animate-tnt-particle" style={{ animationDelay: '2s', animationDuration: '15s' }} />
            <div className="absolute top-60 left-1/3 w-1 h-1 bg-yellow-400/20 rounded-full animate-tnt-particle" style={{ animationDelay: '4s', animationDuration: '10s' }} />
            <div className="absolute top-80 right-1/4 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-tnt-particle" style={{ animationDelay: '1s', animationDuration: '14s' }} />
            <div className="absolute top-32 left-2/3 w-1 h-1 bg-red-400/20 rounded-full animate-tnt-particle" style={{ animationDelay: '3s', animationDuration: '11s' }} />
            <div className="absolute top-96 right-10 w-1 h-1 bg-orange-300/20 rounded-full animate-tnt-particle" style={{ animationDelay: '5s', animationDuration: '13s' }} />
          </div>

          {/* Sidebar - Desktop */}
          <aside className="relative z-10 w-64 hidden md:block shrink-0">
            <div className="fixed top-0 left-0 w-64 h-full glass border-r border-white/5 flex flex-col">
              {/* Logo */}
              <div className="h-16 flex items-center px-6 border-b border-white/5">
                <TNTLogo />
              </div>

              {/* Nav */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Menú Principal</p>
                <NavItem href="/" label="Dashboard" isActive />
                <NavItem href="/users" label="Miembros" />
                <NavItem href="/logs" label="Historial" />

                <div className="my-4 border-t border-white/5" />

                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Sistema</p>
                <NavItem href="/settings" label="Configuración" />
              </nav>

              {/* Bottom */}
              <div className="p-4 border-t border-white/5">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/20 border border-white/10">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">Sistema TNT</p>
                      <p className="text-[10px] text-muted-foreground truncate">v2.0 · Biometric</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-tnt-status-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="relative z-10 flex-1 min-w-0">
            {/* Mobile Top Nav */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 md:hidden glass">
              <TNTLogo small />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-tnt-status-pulse" />
              </div>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 flex items-center justify-around py-2 px-2 md:hidden">
              {[
                { href: '/', label: 'Dashboard', icon: 'D' },
                { href: '/users', label: 'Miembros', icon: 'M' },
                { href: '/logs', label: 'Accesos', icon: 'A' },
                { href: '/settings', label: 'Ajustes', icon: 'S' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-white transition-colors p-1.5 min-w-[60px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold group-hover:bg-white/10 transition-colors">
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 md:p-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
