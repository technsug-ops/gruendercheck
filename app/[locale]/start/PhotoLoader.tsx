"use client";

import { useEffect } from "react";

/** v1: Fotoğraflar ancak dosya gerçekten yüklenince gösterilir; yoksa simgeli zemin kalır. */
export default function PhotoLoader() {
  useEffect(() => {
    document.querySelectorAll<HTMLImageElement>(".ph img, .portrait img").forEach((img) => {
      const ok = () => { if (img.naturalWidth > 0) img.parentElement?.classList.add("loaded"); };
      if (img.complete) ok(); else img.addEventListener("load", ok);
    });
  }, []);
  return null;
}
