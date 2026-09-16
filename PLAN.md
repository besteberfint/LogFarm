PROJE ADI: LogFarm - Local-First AI Hata & Log Analizörü

KİMİM: Yeni mezun bir bilgisayar mühendisiyim. Bu projeyi hem kendimi
geliştirmek hem de staj defterime yazmak hem de mümkünse gerçek gelir
elde etmek için 30 günde tamamlamayı hedefliyorum. Electron, React,
AI API entegrasyonu gibi konularda deneyimim yok, bu projeyle öğreniyorum.

PROBLEM: Geliştiriciler ve DevOps mühendisleri, karmaşık log çıktılarını
(Docker çökmeleri, stack trace'ler, yapılandırılmamış JSON hatalar)
anlamak için zaman kaybediyor. Bunları ChatGPT gibi genel araçlara
yapıştırmak hem format sorunları yaratıyor hem de sohbet geçmişine
yapıştırmayı gerektiriyor; akış dağınık.

ÇÖZÜM: Kullanıcının bilgisayarında çalışan bir masaüstü uygulaması
(senin sunucun yok; analiz geçmişi ve ayarlar yerelde kalır). Kullanıcı
log yapıştırır veya dosya sürükler. Analiz için log, kullanıcının kendi
API anahtarıyla (BYOK) Claude veya OpenAI'ye gider — yani "hiçbir yere
çıkmaz" değil; "benim sunucuma uğramaz, senin seçtiğin AI sağlayıcısına
senin anahtarınla gider." Rapor formatı:

- Özet (1 cümlede sorun ne)
- Kök Neden (hangi dosya/serviste kaynaklanıyor)
- Çözüm Adımları (net komutlar/kod değişiklikleri)

TEKNİK YIĞIN:

- Electron + React + Tailwind CSS
- electron-store (yerel JSON depolama)
- Electron'un yerleşik safeStorage API'si (API anahtarı güvenliği için)
- Claude/OpenAI API (kullanıcı kendi anahtarını giriyor)
- Lemon Squeezy (lisanslama ve ödeme)
- Electron Builder (ilk hedef: Windows kurulum dosyası; Mac/Linux sonra)

İŞ MODELİ: Tek seferlik 29$ ömür boyu lisans. Lansmanda kilit şunu
yapacak: lisans kodu yoksa kullanıcı **3 başarılı analizi** ücretsiz
dener (kendi Claude anahtarıyla; LogFarm Claude faturasını ödemez),
dördüncüde lisans ister. Geliştirme ve 24-26. gün testinde kilit
kapalı (`DEV_UNLOCK`). Sunucu maliyeti yok çünkü uygulama kullanıcının
makinesinde ve kendi API anahtarıyla çalışıyor.

HEDEF KİTLE: Bireysel geliştiriciler, DevOps mühendisleri, küçük
ekiplerdeki altyapı sorumluları.

## Teknoloji Yığını (Netleşmiş Hali)

- **Masaüstü katmanı:** Electron (Tauri değil — Rust öğrenmene gerek yok)
- **Arayüz:** React + Tailwind CSS
- **Yerel veri saklama:** `electron-store` (basit JSON tabanlı, SQLite'a gerek yok)
- **API anahtarı güvenliği:** 13–16. günde Electron `safeStorage` (işletim sistemi Credential Manager / Keychain). Şu an geliştirme için ortam değişkeni veya gitignore'lu `.env`; bu OS kasası değildir.
- **AI entegrasyonu:** Kullanıcının kendi Claude/OpenAI API anahtarı (BYOK)
- **Lisanslama:** Lemon Squeezy API + geliştirme/test için kapatılabilir kilit
- **Paketleme:** Electron Builder. 30 günde öncelik Windows (senin bilgisayarın). Electron teoride Windows, macOS ve Linux'ta çalışır; her sistem için o sistemde (veya o sistemin CI'sında) paket üretmek gerekir. Mac kurulum dosyasını Windows'tan güvenilir üretmek zordur — Mac sürümü ayrı bir iş, ilk lansmanı kilitlemesin.

---



## 30 Günlük Yol Haritası



### 1-2. Gün: Kurulum ve Doğrulama Başlangıcı

- Electron + React + Tailwind projesini kur (bu adım için resmi Electron dokümantasyonunu takip et, AI'ye sormadan önce dene — kotanı burada harcama).
- LinkedIn/Reddit'te 10-15 kişiye soğuk mesaj **zorunlu değil** ve 3-6. günü bekletmesin. Çekiniyorsan atlama. 24-26. gün için 1-3 testçi yeter: sınıf arkadaşın, iş/staj çevresi, Discord'daki bir geliştirici. İstersen o güne yakın sorarsın; şimdi zaman kaybetme.



### 3-6. Gün: Temel Arayüz

- Log yapıştırma kutusu, "Analiz Et" butonu, sonuç gösterme alanı (şimdilik sahte/mock veriyle).
- Bu kısım çoğunlukla standart React/Tailwind, AI'ye küçük parçalar halinde sor, tüm arayüzü tek seferde istemek yerine.



### 7-12. Gün: AI API Entegrasyonu (Çekirdek Özellik)

- Claude/OpenAI API bağlantısını kur, prompt'u tasarla ("Özet / Kök Neden / Çözüm Adımları" formatı).
- Bu, projenin en kritik ve en çok AI desteği gerektiren kısmı — Cursor Agent kotanın büyük kısmını burada kullan.
- Elinde artık "yapıştır → analiz et → sonuç gör" çalışan bir prototip olmalı.

**Not — Anthropic bakiye ve anahtar (unutma):** Console'da yüklenen kredi (ör. 5$) **hesaba** aittir, tek bir anahtara kilitli değildir. Yeni API anahtarı üretmek tekrar ödeme gerektirmez. Mevcut anahtarı iptal edip yenilemek **şart değil**; uygulama aynı anahtarla devam eder. PowerShell'e `$env:ANTHROPIC_API_KEY=...` yazıldıysa komut geçmişte kalabilir — rotasyon isteğe bağlı, panik yok. Kalıcı/güvenli saklama **13–16. gün** (`safeStorage`).

**7-12 kapanış:** Claude ile "yapıştır → analiz et → rapor" çalışıyor (iptal, uzun log kesme, 60 sn zaman aşımı). OpenAI ikinci sağlayıcı/anahtar/fatura ister; 30 günde zorunlu değil, zaman kalırsa sonra eklenir.



### 13-16. Gün: Güvenlik ve Yerel Depolama

- `safeStorage` ile API anahtarını güvenli sakla (7–12. gündeki `.env` / ortam değişkeninin yerini alır; anahtarı yenilemek hâlâ şart değil).
- `electron-store` ile geçmiş analizleri kaydet.
- Dosya sürükle-bırak özelliği ekle.

**13-16 kapanış:** Anahtar `safeStorage` ile bu makinede; geçmiş `electron-store` ile yerelde; log yapıştırma + dosya bırakma/seçme çalışıyor. Geliştirmede `.env` hâlâ yedek anahtar kaynağı.



### 17-19. Gün: Cila ve Paketleme Testi

- Karanlık mod, kopyalama butonları gibi küçük UX iyileştirmeleri.
- Electron Builder ile **Windows** deneme paketlemesi yap — bu adımda genelde beklenmedik hatalar çıkar, erken test etmek 40 günün en büyük derslerinden biriydi, şimdi erkene çektik.
- Mac/Linux paketini bu pencerede şart tutma.
- **18. gün notu — paketleme dersleri:** `npm run dist` ile Windows kurulumu (`release/LogFarm Setup <sürüm>.exe`) üretiliyor. İki tuzak: (1) `EPERM: rename ... win-unpacked.tmp` hatası antivirüsün yeni açılan dosyaları taramasından çıkıyor, `release` klasörünü silip komutu tekrarlamak çözüyor; (2) paketin içinde `.env` yok, yani paketlenmiş uygulamada anahtar **mutlaka** arayüzdeki ayarlardan (`safeStorage`) girilmeli. Kurulum imzasız olduğu için Windows SmartScreen uyarısı normal.
- **19. gün: Dil seçeneği (TR/EN).** Tek yönlü "arayüzü İngilizceye çevir" maddesinin yerini alır — metinleri iki kez elden geçirmemek için. Seçim hem arayüz metinlerini hem de Claude prompt'undaki rapor dilini belirler; tercih `electron-store` ile hatırlanır. Varsayılan: İngilizce (hedef kitle uluslararası), Türkçe seçenek kalır. Paketleme testinden (18. gün) sonra yapılır ki paket denemesi erken kalsın.

**17-19 kapanış:** Kopyalama butonları, Windows kurulumu (`npm run dist`) ve TR/EN dil seçeneği tamam. Dil altyapısının kuralı: ana süreç kullanıcıya hazır metin döndürmez, `errors.*` kodu döndürür (`electron/errors.cjs`); metni arayüz `src/i18n/translations.ts` üzerinden üretir. Yeni bir hata mesajı eklerken kodu iki yere de yazmak gerekir. Rapor dili prompt'a `buildSystemPrompt(language)` ile geçer, yani dil değiştirmek **yeni** analizleri etkiler; geçmişteki kayıtlar üretildikleri dilde kalır. Geliştirme ve kurulu sürüm aynı `%APPDATA%\LogFarm` klasörünü paylaşır, ikisini aynı anda açmamak gerekir.



### 20-23. Gün: Lisanslama (önce bağla, testte açık bırak)

- **İsim kararı (LogFarm):** Ürün adı LogFarm. Alt başlık: Log harvest (Farm ile kafiye). Slogan: “Harvest the insight. Cut the noise.” Header’da logo + slogan; vurgu rengi logodaki koyu yeşil. Lemon Squeezy mağaza URL’sini `logfarm` yap (önceki `logmelt` slug’ını bırak). `logfarm.com` dolu; landing için `.dev` / `.app` bakılır. Diskteki proje klasörü `logpulse` kalabilir.
- Lemon Squeezy hesabı: **test modu 20–23 için yeter.** Canlı satış (kimlik, W-8, banka) lansmana kadar bekleyebilir. Türkiye banka/PayPal ödemesi destekleniyor. Şirket yoksa “business name” kimlikteki ad soyad; website şu an yoksa GitHub/LinkedIn yaz, 27. günde landing ile değiştir.
- Lisans doğrulama API'sini uygulamaya bağla (kullanıcı kod girer → activate/validate → kilit açılır).
- **Deneme (BYOK, ücretsiz analiz değil):** Lisans yokken ilk **3 başarılı analiz** serbest; dördüncüde kilit. Sayaç yerelde (`electron-store`). Bu, "ilk log Claude faturamıza yazılsın" değildir — o model sunucu + ortak anahtar ister, local-first/BYOK ile çelişir ve her denemede sen ödersin.
- Aynı dönemde bir **test/geliştirme kilidi**: örn. `DEV_UNLOCK=true`. 24-26. gün testçiler hem lisans hem deneme kotasını görmez. Lansmanda bayrak kapanır.

**20–21 notu:** Kilit iskeleti bağlandı. Analiz Et ana süreçte `assertCanAnalyze` ile durur; sayaç yalnızca **başarılı** analizde artar. `DEV_UNLOCK=true` (`.env`) kilidi kapatır. Lemon Squeezy Activate/Validate/Deactivate çağrısı hazır; ürün tanımı yokken gerçek anahtar “invalid” döner — o 22. gün işi. Denemeyi görmek için `DEV_UNLOCK` satırını ekleme veya `false` yaz.

**22–23 notu:** Test checkout + Activate çalıştı. Cila: müşteri metninden `DEV_UNLOCK` çıktı; kilitte **Lisans al** LogFarm checkout linkini açar (`/checkout/buy/aa5ef5c0-0bea-4f3e-a1f4-5bdc800daf4c`; isteğe bağlı `LEMON_CHECKOUT_URL`). Mağaza ana sayfası (`logfarm.lemonsqueezy.com`) KYC’siz “store has not been activated” verir — buy linki onu atlar. Lisanslıyken anahtar kutusu gizlenir; **Kaldır** onay ister (tek koltuk); kayıtlı lisans oturumda bir kez validate edilir — ağ yoksa yerel kayıt kalır, Lemon `valid: false` derse silinir. Lemon hata metinleri TR/EN koda map edilir. Canlı KYC 29. güne.



### 24-26. Gün: Gerçek Kullanıcı Testi

- Kilitsiz (test) Windows paketini 1-3 kişiye gönder, geri bildirim topla. 1-2. günde Reddit'e yazmış olman şart değil.
- **Logo / uygulama ikonu:** Header’da şeffaf `public/logo-mark.png` (detaylı logo) var. Pencere başlığı ve görev çubuğu aynı `.ico` işaretini kullanır: kırık çatılı çizgi ahır + iki kapı + ortada bronz böcek (`npm run icon` → `scripts/make-icon.cjs`). Tüm boyutlar 256px ustadan küçültülür, yani 16px ile 32px ayrı motif değil. Çizgi kalınlığı kanvas oranı (`STROKE_REL`); piksele bağlıyken 32px'te 1px altına düşüp siliniyordu. Çatı kırığının sapması bu kalınlıktan büyük olmalı, yoksa düz üçgen görünüyor. `app.setAppUserModelId('com.logfarm.app')` olmazsa Windows görev çubuğunda Electron ikonunu gösterir. Kurulum dosyası adı `LogFarm Setup ...exe` olur.
- Kritik hataları düzelt (bu aşamada "her şeyi mükemmelleştirme" tuzağına düşme, sadece çalışır halde tut).
- **Ayarlar sayfası:** API anahtarı ve lisans ana ekrandan çıktı; header’daki dişli ile açılan Ayarlar görünümüne taşındı. Dil ve geçmiş yerinde. Ana ekranda yalnızca gerektiğinde şerit çıkar (anahtar yok / deneme bitti) ve Ayarlar’a götürür.
- **Rapor ikonları:** Özet = buğday demeti, Kök neden = kök, Adımlar = sürülmüş tarla sıraları (`ReportPanel.tsx` içinde satır içi SVG, 18px). Emoji yok; başlıklar taranabilir kalıyor.

**24. gün:** Kilitsiz test kurulumu `npm run dist:test` — proje içinde `release/LogFarm-Setup-<sürüm>-Test.exe`. Pakette `.env` yok; kilit `build/test-unlock.json` extraResources ile gömülür (lansman `npm run dist` bunu koymaz). `extraMetadata` kullanılmaz — electron-builder kaynak `package.json` script’lerini silmişti. Ahır `.ico` zaten `build/icon.ico`. Desktop’taki `EPERM: win-unpacked.tmp` için asıl paket `%TEMP%\logfarm-release` içinde üretilip exe geri kopyalanır. Testçi kendi Claude anahtarını girer; lisans gerekmez. SmartScreen imzasız uyarı normal. 1–3 kişiye gönder; Reddit şart değil.



### 27-28. Gün: Landing Page

- Vercel'de tek sayfalık basit bir tanıtım sayfası (ne yaptığı, ekran görüntüsü, satın al butonu). Vaatte: yerel uygulama + BYOK; "log hiçbir sunucuya gitmez" deme.



### 29-30. Gün: Lansman

- Lisans kilidini aç (ücretli moda al).
- Product Hunt'ta yayınla, Reddit/Twitter'da paylaş; test edenlere doğrudan ulaş.

