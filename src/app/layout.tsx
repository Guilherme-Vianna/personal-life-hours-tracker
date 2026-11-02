import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "Horas na Vida", template: "%s · Horas na Vida" },
  description: "Controle do tempo livre e progresso de estudos",
};

export const viewport: Viewport = { themeColor: "#1f4a36" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
