import type { Metadata } from "next";

// Yönetici paneli kendi kök düzenine sahip (dil öneki yok, sadece Türkçe). v1: legacy/admin.html <head>.
export const metadata: Metadata = { title: "Başvurular", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
