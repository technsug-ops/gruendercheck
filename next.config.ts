import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// cacheComponents bilerek kapalı: sayfaların çoğu kişiye özel (id ile) ve dinamik.
const nextConfig: NextConfig = {};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
