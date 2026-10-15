import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGC — Gestión de Condominios y Residencias",
  description: "Plataforma multi-tenant para administración integral de condominios y residencias habitacionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
