import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Enterprise Admin Control Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 text-white min-h-screen p-6 flex-shrink-0">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">Admin<span className="text-indigo-400">Panel</span></h2>
            <nav className="space-y-2">
              <Link href="/" className="block py-2 px-4 rounded hover:bg-slate-800 transition-colors">Overview</Link>
              <Link href="/products" className="block py-2 px-4 rounded hover:bg-slate-800 transition-colors">Moderation Queue</Link>
              <span className="block py-2 px-4 rounded text-gray-500 cursor-not-allowed">Users</span>
              <span className="block py-2 px-4 rounded text-gray-500 cursor-not-allowed">Settings</span>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
