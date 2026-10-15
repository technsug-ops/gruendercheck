import { DEV_IDS } from "../../dev-data";
import type { VisualPage } from "../types";

export const pages: VisualPage[] = [
  { name: "report-de", path: `/de/r?id=${DEV_IDS.de}` },
  { name: "report-tr", path: `/tr/r?id=${DEV_IDS.tr}` },
  {
    name: "report-missing-de", path: "/de/r?id=00000000-0000-4000-8000-000000000000",
    known: "v1 hatası: gizli olması gereken araç çubuğu (.actions{display:flex} hidden'ı eziyor) boş bir düğme gösteriyor; yeni sürümde yok.",
  },
];
