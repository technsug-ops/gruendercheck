# Gründungs-Check formu — kurulum

Ana adres: https://foundercheck.de (gruenderchek.de kalıcı olarak buraya yönlenir).
Adresler: `/de` Almanca form, `/tr` Türkçe form, `/admin` yönetici sayfası. Ana adres (`/`) Almanca formu açar.

## 1. Yayınlamadan önce doldur
`app.html` dosyasının başındaki `OPERATOR` bloğu: sokak ve posta kodu, soyadın, iletişim e-postası. Bunlar Impressum ve Datenschutz metninde görünür; boş haliyle formu kimseyle paylaşma.

## 2. Vercel'de kurulum (yaklaşık 10 dakika)
1. Vercel'de yeni proje: bu klasörü yükle (veya bir GitHub reposuna koyup bağla). Framework: "Other". Function region: Frankfurt (fra1).
2. **Storage → Create → Blob**: erişim **Private**, bölge **Frankfurt (fra1)**, projeye bağla. Gerekli anahtar projeye otomatik eklenir.
3. **Settings → Environment Variables**: `ADMIN_PASSWORD` = uzun, rastgele bir şifre (en az 20 karakter). Production için.
4. Yeniden yayınla (Redeploy), ki anahtarlar devreye girsin.

## 3. Test
1. `/de` adresinde formu doldur, gönder.
2. `/admin` adresinde şifreyle gir; başvuru listede görünmeli.
3. Test başvurusunu "Sil" ile kaldır.

## Nasıl çalışıyor
- Cevaplar Vercel Blob'da, Frankfurt'ta, **private** olarak saklanır; sadece yönetici sayfası şifreyle okuyabilir.
- Gizli bir "website" alanı spam botlarını eler.
- Sayfa çerez, analiz aracı, dış yazı tipi veya dış betik kullanmaz.
- Yönetici sayfasındaki **"Claude için kopyala"** düğmesi cevapları isim ve e-posta **olmadan** kopyalar (Datenschutz metninde bu böyle vaat ediliyor).
- Her başvurunun durumu (Yeni → Rapor gönderildi → Geri bildirim → Takip istedi → Ödedi) yönetici sayfasından değiştirilebilir; üstteki sayaçlar Faz 1 karar kapısı için.

## Business plan (plan.html, plan.js, api/plan.js)
1. Yönetici sayfasında başvurunun "Plan formu linki" düğmesi kişiye özel linki kopyalar (`/de/plan?id=…` veya `/tr/plan?id=…`). Linki e-postayla gönder, durumu "Plan formu gönderildi" yap.
2. Kişi formu doldurunca başvuruda "Plan verisi var" etiketi çıkar. Kişi linki tekrar açıp düzeltebilir, son gönderim geçerli.
3. "Plan için Claude'a kopyala" denetim cevaplarını, plan metinlerini ve kodla hesaplanan finans tablolarını (Kapitalbedarf, Finanzierung, Rentabilität 3 yıl, Liquidität) isim/e-posta olmadan kopyalar. Claude projesinde yeni sohbete yapıştır; BUSINESSPLAN-TALIMATI'na göre Almanca plan çıkar.
4. "Plan CSV" 36 aylık ayrıntıyı Excel'de açılabilir dosya olarak indirir.

## Hesap motoru (calc.js)
Yönetici sayfası her başvuru için başabaş, kira/ciro oranı, duyarlılık, nakit dip noktası, sermaye açığı ve (online işlerde) katlanılabilir müşteri edinme maliyetini kodla hesaplar. KDV varsayımını başvuru başına seçebilirsin (%19, %7, kafe karışımı, restoran karışımı, KDV yok). "Claude için kopyala" bu hesapları da kopyalar; rapor promptu (v0.5) bu sayıları yeniden hesaplamadan kullanır.

## E-posta (lib/mail.js)
Gönderim all-inkl üzerinden, `rapor@gruenderchek.de` posta kutusundan (SMTP w022397f.kasserver.com:465).
- Yeni başvuru, plan formu ve geri bildirimde `NOTIFY_TO` adresine kısa bildirim gider. Bildirimde fikir metni ve kişisel veri yoktur, sadece dil, kanal, şehir ve yönetici linki.
- Başvurana formun dilinde onay e-postası gider (Almanca e-postada Türkçe metin yok). Cevaplar rapor@ kutusuna düşer.
- Vercel ortam değişkenleri: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `MAIL_FROM`, `NOTIFY_TO`. Posta kutusu şifresi değişirse `SMTP_PASS` güncellenip yeniden yayınlanmalı.
- Gönderim hatası başvuruyu bozmaz; kayıt yine de saklanır.
- SMTP girişi posta kutusunun `m0…` kullanıcı adıyla yapılır (e-posta adresiyle değil). foundercheck.de kutusu: kullanıcı `m082c9b2`, sunucu `w0223a74.kasserver.com`.
- Ortam değişkeni değiştikten sonra yeniden yayın **zorunlu yeni yayın** (forceNew) olmalı; aynı dosyalarla normal yayın, eski değişkenlerle önceki yayını yeniden kullanabiliyor.

## Otomatik rapor taslağı (Claude API)
Form gönderilince `lib/draft.js` arka planda (Vercel `waitUntil`, en fazla 300 sn) rapor taslağını yazar ve `drafts/<id>.json` olarak saklar; sana "Rapor taslağı hazır" bildirimi gider.
- Model isim ve e-posta görmez; `brief.js` "Claude için kopyala" ile aynı metni üretir. Sistem metni: `lib/kb.js` (RAPOR-TALIMATI + ALMANYA-KURAL-TABANI, kural tabanı önbellekli).
- Yönetici sayfasında taslak düzenlenir: "Önizle / PDF", "Düzeltmeyi kaydet", "Onayla ve gönder", "Yeniden oluştur". Ön kontrol soruları sarı kutuda.
- "Onayla ve gönder": rapor `reports/<id>.json` olur, başvurana `/de/r?id=…` veya `/tr/r?id=…` linki ve geri bildirim linki gider, durum "Rapor gönderildi" olur. Rapor sayfasında "PDF olarak kaydet" düğmesi var.
- Ortam değişkenleri: `ANTHROPIC_API_KEY` (zorunlu, yoksa otomatik taslak atlanır), `ANTHROPIC_MODEL` (varsayılan `claude-sonnet-5-5`), `AUTO_SEND=1` (ön kontrol sorusu olmayan taslağı onaysız gönderir; varsayılan kapalı), `ANTHROPIC_WEB_SEARCH=1` (isteğe bağlı web araması).
- Talimat veya kural tabanı değişince `lib/kb.js` yeniden üretilip yayınlanmalı.
- `/lib/*` adresleri dışarıdan açılmaz (ana sayfaya yönlenir).

## Ana sayfa (landing.html)
`/` Almanca, `/tr/start` Türkçe tanıtım sayfası. Form adresleri değişmedi (`/de`, `/tr`); `?k=kanal` etiketi ana sayfadan forma taşınır.
