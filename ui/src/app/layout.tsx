import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "ReleaseRite",
  description: "Release management UI on top of FastAPI backend"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}

