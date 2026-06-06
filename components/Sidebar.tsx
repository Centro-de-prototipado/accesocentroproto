"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function TNTLogo() {
  return (
    <div className="relative inline-flex items-center gap-1.5">
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 w-64 hidden md:block shrink-0">
      <div className="fixed top-0 left-0 w-64 h-full glass border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <TNTLogo />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Menú Principal</p>
          <NavItem href="/" label="Dashboard" isActive={pathname === '/'} />
          <NavItem href="/users" label="Usuarios" isActive={pathname.startsWith('/users') || pathname.startsWith('/admin/membresias')} />
          <NavItem href="/logs" label="Historial" isActive={pathname === '/logs'} />

          <div className="my-4 border-t border-white/5" />

          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Sistema</p>
          <NavItem href="/settings" label="Configuración" isActive={pathname.startsWith('/settings') || pathname.startsWith('/admin/login')} />
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
  );
}
