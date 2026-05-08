import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modern Pro Dashboard | بريد مؤقت + محمل فيديوهات",
  description: "لوحة تحكم احترافية وعصرية لخدمات البريد المؤقت وتحميل الفيديوهات مع دعم كامل لربط واجهة Python/Flask الخلفية.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Cairo', 'Outfit', sans-serif" }} className="bg-slate-900 text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
