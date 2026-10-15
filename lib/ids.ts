/** Başvuru id'si (UUID) biçim kontrolü; veritabanına gitmeden önce. */
export const isId = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

export const SITE = "https://foundercheck.de";
