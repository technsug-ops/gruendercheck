import type { Page } from "@playwright/test";

export interface VisualPage {
  /** Dosya adı ve filtre için: "<sayfa>-<durum>-<dil>" */
  name: string;
  /** v1 ve yeni sürümde aynı adres */
  path: string;
  /** Ekran görüntüsünden önce sayfada yapılacaklar (ör. form doldurup ileri basmak). İki sürümde de aynen çalışır. */
  prepare?: (page: Page) => Promise<void>;
  /** v1'den bilinçli fark: varsa sonuç başarısız sayılmaz, gerekçe yazdırılır. */
  known?: string;
}
