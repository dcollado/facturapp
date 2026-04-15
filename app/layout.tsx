import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestor de Facturas",
  description: "App personal para organizar facturas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-white text-slate-900">
         <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

            {/* LOGO */}
            <a
              href="/"
              className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-indigo-600"
            >
              Facturas App
            </a>

            {/* MENU */}
            <nav className="flex items-center gap-6 text-sm">

              <a
                href="/"
                className="text-slate-600 transition-all duration-150 hover:text-indigo-600 hover:font-semibold"
              >
                Inicio
              </a>

              <a
                href="/facturas"
                className="text-slate-600 transition-all duration-150 hover:text-indigo-600 hover:font-semibold"
              >
                Facturas
              </a>

              <a
                href="/nueva_factura"
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-all duration-150 hover:bg-indigo-700 hover:font-semibold"
              >
                + Nueva
              </a>

            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}