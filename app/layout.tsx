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
  title: 'TNTControl — Control de Acceso Biométrico',
  description: 'Sistema de acceso biométrico para gimnasios con monitoreo en tiempo real',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={outfit.className}>
        <div className="flex min-h-screen">
          {/* Sidebar - Desktop only */}
          <aside className="w-64 bg-card border-r border-border hidden md:block shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-border">
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-red-500">TNT</span><span className="text-blue-500">Control</span>
              </h1>
            </div>
            <nav className="p-4 space-y-2">
              <Link href="/" className="block px-4 py-3 rounded-md bg-primary/10 text-primary font-medium">Dashboard</Link>
              <Link href="/users" className="block px-4 py-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Usuarios</Link>
              <Link href="/settings" className="block px-4 py-3 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Settings</Link>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 bg-background min-w-0">
            {/* Mobile Top Nav */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-border md:hidden">
              <h1 className="text-lg font-black tracking-tight">
                <span className="text-red-500">TNT</span><span className="text-blue-500">Control</span>
              </h1>
            </header>
            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around py-2 md:hidden">
              <Link href="/" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Dashboard
              </Link>
              <Link href="/users" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Usuarios
              </Link>
              <Link href="/settings" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Settings
              </Link>
            </nav>
            <div className="p-4 md:p-8 pb-20 md:pb-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
