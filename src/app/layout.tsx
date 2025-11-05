import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitTrack",
  description: "Suivi de fitness et calculatrice IMC avec FitTrack",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#F5F5F5] text-[#333333] antialiased">
        {children}
      </body>
    </html>
  );
}
