import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// v1 (legacy/vercel.json) ile aynı güvenlik başlıkları. CSP sadece üretimde: next dev eval kullanır.
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex" },
  ...(process.env.NODE_ENV === "production"
    ? [{
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      }]
    : []),
];

// cacheComponents bilerek kapalı: sayfaların çoğu kişiye özel (id ile) ve dinamik.
const nextConfig: NextConfig = {
  // Yerel geliştirme veritabanı (PGlite) paketlenmesin.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/manifest-:lang(de|tr).webmanifest", headers: [{ key: "Content-Type", value: "application/manifest+json" }] },
      { source: "/:path*", headers: security },
    ];
  },
  async redirects() {
    return ["gruenderchek.de", "www.gruenderchek.de"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://foundercheck.de/:path*",
      permanent: true,
    }));
  },
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
