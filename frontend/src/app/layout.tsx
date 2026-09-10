import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma Nacional de Tramites",
    template: "%s | Plataforma Nacional de Tramites",
  },
  description:
    "Catalogo nacional de tramites del Estado de Guatemala: busca requisitos, pasos, costos y tiempos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-texto">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primario focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        <header className="border-b border-borde bg-superficie">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded bg-primario text-sm font-bold text-white"
              >
                GT
              </span>
              <span className="leading-tight">
                Plataforma Nacional
                <span className="block text-xs font-normal text-texto-suave">
                  de Tramites
                </span>
              </span>
            </Link>
            <nav className="text-sm">
              <Link
                href="/tramites"
                className="rounded px-3 py-2 font-medium text-primario hover:bg-primario-suave"
              >
                Buscar tramites
              </Link>
            </nav>
          </div>
        </header>

        <main id="contenido" className="flex-1">
          {children}
        </main>

        <footer className="mt-16 border-t border-borde bg-superficie">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-texto-suave">
            <p>
              Plataforma Nacional de Tramites de Guatemala. Proyecto en
              construccion. La informacion puede estar incompleta o pendiente de
              verificacion.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
