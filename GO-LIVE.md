# Go-live checks

LogFarm canlıya çıkmadan önce kapatılacak işler. Sırayla ilerle. Bir madde bitince durumunu bu dosyada güncelle.

Bu liste bir web servisi listesi değil. LogFarm kullanıcının bilgisayarında çalışan bir Electron uygulaması. Kendi sunucusu, kullanıcı hesabı, SQL veritabanı ve çerezi yok. Analiz yerelde kalır. Claude çağrısı kullanıcının kendi API anahtarıyla gider (bring your own key, BYOK). Lisans Lemon Squeezy üzerinden doğrulanır.

Durum sözleri: `done`, `next`, `later`, `user action`, `accepted limit`, `does not apply`.

## Sıra

### 1. Electron shell — `done`

Renderer (arayüz süreci) ana sürece (main process) yalnız preload köprüsüyle konuşur. Bu köprü API anahtarını, lisansı ve Claude çağrısını kullanabildiği için sayfanın yabancı bir adrese gitmesi veya içine yabancı içerik girmesi asıl risktir.

Yapılanlar:

- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`. Worker ve subframe için de `nodeIntegration` kapalı. `webviewTag: false`.
- `webSecurity: true`, `allowRunningInsecureContent: false`.
- `navigateOnDragDrop: false`. Dosyayı pencereye bırakmak sayfayı o dosyaya götürmez. Arayüzde `dragover` / `drop` için `preventDefault` zaten vardı (`src/App.tsx`).
- `will-navigate` ve `will-redirect` kesilir. Geliştirmede yalnız `http://localhost:5173`. Pakette yalnız `dist/index.html`. Kod: `electron/shellGuard.cjs`, `electron/main.cjs`.
- `will-attach-webview` engelli.
- `setWindowOpenHandler` yeni pencereyi reddeder. İstisna: `https` ve `lemonsqueezy.com` ödeme linki, sistem tarayıcısında `shell.openExternal` ile açılır.
- İzinler kapalı. Açık olanlar: `clipboard-sanitized-write`, `clipboard-write`.
- `requestSingleInstanceLock`. İkinci kopya kapanır, mevcut pencere öne gelir. İkisi birden `%APPDATA%\LogFarm` yazmasın diye.

Doğrulama notu: üretim sayfası tarayıcıda açıldı (`vite preview`). Electron penceresi madde 7'de açıldı.

### 2. Content Security Policy — `done`

Üretim `index.html` içine meta etiketi yazılır. Geliştirme sunucusuna yazılmaz. Hot module replacement (HMR) eval ve websocket ister.

Politika: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'`.

`connect-src 'none'` doğru. Claude ve Lemon istekleri renderer'dan değil, main process içinden gider. Kod: `vite.config.ts`.

### 3. Authorization — `done` (bu ürün için)

Çok kullanıcılı kaynak yok. Kapı lisans. `assertCanAnalyze` analizde vardı. Geçmiş çevirisi (`history-localize`) dışarıdaydı. Kilitliyken dil değiştirmek Claude'a gidebiliyordu. Çeviriden önce de aynı kapı var (`electron/main.cjs`). Lisans yoksa gerçek analiz ve çeviri durur. Deneme hakkı yok.

Not: kilitliyken çeviri hatası `localizeError` olarak döner. Arayüz bu alanı okumaz. Kullanıcı zaten kilit şeridini görür. Çeviri sessizce yapılmaz.

### 4. Input validation — `done`

- Log: string, boş olamaz, en fazla 2_000_000 karakter (`errors.logTooLarge`). API'ye giden metin zaten 80_000 karakterde kesilir (`truncateLog`).
- API anahtarı: en fazla 300 karakter ve `sk-ant-` ile başlamalı (`electron/keyStore.cjs`).
- Lisans anahtarı: boşluklar silinir, en fazla 256 karakter (`electron/licenseGate.cjs`).
- Dil: yalnız `en` ve `tr`.
- Dosya: sunucuya yükleme yok. Yerel `File`. 2 MB üstü kesilir, içindeki null bayt metin sayılmaz (`src/lib/readLogFile.ts`). `accept` listesi yalnız ipucu. Güvenlik sınırı değil.

### 5. Secret management — `done` (ekranda sızıntı)

Hata ayrıntısı arayüze gitmeden temizlenir (`scrubDetail`, `electron/errors.cjs`): `sk-ant-...`, `sk-...`, `Bearer ...`, UUID biçimli lisans dizisi. Metin 300 karakterde kesilir.

`.env` gitignore'da ve `package.json` `build.files` dışında. Müşteri paketine girmez. `loadEnv.cjs` kaynak ağacındaki `.env` dosyasını okur. Paketlenmiş uygulamada bu yol asar içindedir. Paketin yanına konan `.env` kendiliğinden yüklenmez.

API anahtarı ve lisans kaydı `safeStorage` ile şifreli (`api-key.bin`, `license.bin`). Anahtar ve lisans loglanmıyor.

### 6. Prompt injection — `done` (kural metni)

Log, modele talimat değil veri olarak yazıldı (`electron/prompt.cjs`, Untrusted input). Çeviri prompt'unda da aynı kural var (`electron/claude.cjs`). Cevap `submit_report` aracına kilitli. Model yine de `steps` içine zararlı bir komut yazabilir. Kullanıcı o komutu kendisi kopyalar. Bunu kodla kapatmanın sağlam yolu yok. Adımlar öneridir.

### 7. Electron window check — `done`

12 Ekim 2026. Geliştirme penceresi `http://localhost:5173` üzerinde açıldı. Renderer komut satırında `--enable-sandbox` vardı.

- Köprü duruyor: `window.logfarm.analyze` fonksiyon. Sayfada `require`, `process` ve `Buffer` yok.
- Ayarlar açıldı. Claude API key alanı göründü, log kutusu o sırada yoktu. Geri ile analiz ekranına dönüldü.
- Boş logda Analyze kapalı. Metin yazılınca açıldı. Düğmeye basılmadı. Claude çağrısı yok.
- Geçmişteki İngilizce kayıt açıldı. Copy, gerçek tıklamayla Copied oldu. `clipboard-sanitized-write` izni çalışıyor. Bu tıklama panoya o raporun metnini yazdı.
- İkinci `electron .` süreç kodu 0 ile kapandı. İlk pencere `http://localhost:5173/` adresinde kaldı. Sayfa hedefi tek kaldı.
- `location.assign` ile `https://example.com` ve `file:///C:/Windows/win.ini` pencereyi oraya götürmedi.
- Başlığın üzerine bırakılan sahte dosya adresi değiştirmedi. Log kutusuna da yazılmadı. İşletim sisteminin kendi sürükle-bırakı ayrıca denenmedi. `navigateOnDragDrop: false` ve `will-navigate` bu yolu keser.

Dil: arayüz EN idi. EN düğmesi bozmadı. TR basılmadı. Geçmişte Türkçe metni olmayan 1 kayıt var (`trMissing: 1`). TR'ye geçmek Claude çevirisi başlatır. O çağrı bu kontrolde yapılmadı.

### 8. Dependency scanning — `done`

12 Ekim 2026, ilk `npm audit`: 2 critical, 2 high, 8 moderate. Toplam 12.

Güncellenenler, hepsi geliştirme ağacı. Üretim bağımlılıkları (`react`, `react-dom`, `electron-store`) değişmedi. `electron-builder` 26.15.3 yerinde kaldı.

- `concurrently` 10.0.5 → 10.0.6. Altındaki `shell-quote` 1.9.0 → 1.12.0. Critical kayıt kapandı. `npx concurrently --version` çalıştı.
- `source-map-js` 1.2.1 → 1.2.2. Aralık `^1.2.1` buna izin veriyor. Vite ve Tailwind derleme ağacında. High kayıt kapandı.
- `http-cache-semantics` 4.2.0 → 4.3.0. Aralık `^4.0.0`. `electron-builder` → `got` → `cacheable-request` altında. High kayıt kapandı. Paketleyici sürümü değişmedi.

Yeniden `npm audit`: 8 moderate. Hepsi aynı zincir: `sprintf-js` → `roarr` → `global-agent` → `@electron/get` → `app-builder-lib` → `electron-builder` 26.6.0–27.0.0-alpha.2. Önerilen düzeltme `electron-builder@26.5.0`. Bu bir düşürme. Uygulanmadı. Bu paketler müşteri uygulamasına girmez. Paketlerken kullanılan araçtadır. Daha yeni bir 26.x sürümü bu aralığın dışında değil. `npm audit fix` ve `npm audit fix --force` çalıştırılmayacak.

### 9. Electron fuses ve paket içi — `done`

14 Ekim 2026. Kod: `electron-builder.win.cjs` (`asar: true`, `electronFuses`). Doğrulama `electron-builder --win --dir` ile `%TEMP%\logfarm-release\win-unpacked`. Tam NSIS kurulum bu maddede yeniden üretilmedi; asar ve fuse aynı `LogFarm.exe` üzerine yazılıyor.

Paket içi (`app.asar` extract):

- `dist/index.html` içinde Content Security Policy var (`connect-src 'none'` dahil).
- `electron/main.cjs` ve `electron/preload.cjs` asar içinde.
- `.env` yok.
- Müşteri paketinde extraResources yalnız `app.asar`. `test-unlock.json` yok.
- Test paketi `LOGFARM_TEST_PACK=1` iken `build/test-unlock.json` → `test-unlock.json` (`devUnlock: true`). Bu dosya müşteri extraResources listesinde yok.

`npx @electron/fuses read` (müşteri `LogFarm.exe`):

- `RunAsNode` Disabled
- `EnableCookieEncryption` Enabled
- `EnableNodeOptionsEnvironmentVariable` Disabled
- `EnableNodeCliInspectArguments` Disabled
- `EnableEmbeddedAsarIntegrityValidation` Enabled
- `OnlyLoadAppFromAsar` Enabled
- `GrantFileProtocolExtraPrivileges` Enabled

`grantFileProtocolExtraPrivileges: false` denendi. Süreç ayakta kaldı, renderer `app.asar` yolunu açtı, ama sayfa boş kaldı: başlık paket adı (`logfarm`), varsayılan Electron menüsü, arayüz yok. `true` ile başlık `LogFarm`, analiz ekranı yüklendi. `loadFile` `file://` kullandığı için bu fuse `true` kaldı.

Okuyucu ayrıca adsız bir fuse’u `undefined is Enabled` diye yazıyor. Bizim listede yok. `LoadBrowserProcessSpecificV8Snapshot` Disabled (varsayılan).

Açık bir `electron .` varken ikinci `LogFarm.exe` tek-örnek kilidiyle kod 0 çıkar. Fuse denemesi ayrı `--user-data-dir` ile yapıldı.

Otomatik güncelleme yok. Eklenirse imzasız indirme yeni bir risk. O iş bu listeye ayrıca yazılmadan eklenmesin.

### 10. Rate limiting — `done`

Aynı anda tek Claude isteği. İkinci analiz veya çeviri, süren isteği iptal etmez. `errors.busy` döner. İptal düğmesi ayrı durur.

Başarılı ya da ağa çıkmış her isteğin ardından 1,5 saniye beklenir. Bu süre normal bir sonraki tıklamadan kısadır. Onarım çağrısı ve çeviri grupları (4’lü) da bu aralığın içindedir. Kod: `electron/claudePace.cjs`, `electron/claude.cjs`.

### 11. Global exception handling — `done`

IPC kanalları `try/catch` içinde ve `toErrorPayload` döner. Yakalanmayan `uncaughtException` ve `unhandledRejection` konsola yalnızca `errors.*` kodunu yazar. Anahtar, lisans, ham log ve yığın yazılmaz. Aynı kod pencereye gider; arayüz onu çevirir. Kod: `electron/processGuard.cjs`.

### 12. Privacy disclosure — `done`

Mağaza ve uygulama metninde durması gereken akış:

- Log metni `https://api.anthropic.com/v1/messages` adresine, kullanıcının anahtarıyla gider. LogFarm sunucusuna uğramaz.
- Geçmiş `%APPDATA%\LogFarm` altında düz JSON. Logun içindeki parola veya token diskte düz durur. Prompt sırları `[redacted]` yazmayı ister. Bu, diskteki ham logu silmez.
- Lisans anahtarı Lemon'a gider. Örnek adı `LogFarm-` artı `os.hostname()` (`electron/lemonLicense.cjs`). Bu, makine adıdır.
- Ödeme kartı LogFarm'da durmaz. Checkout Lemon sayfasıdır.

Metin TR ve EN. Ayarlarda `PrivacySettings`. Aynı gerçekler sitenin “Where the log goes” bölümünde, İngilizce. Sitedeki “3 deneme” cümlesi kaldırıldı. Lemon mağaza panosuna bu metin ayrıca yapıştırılmalı. Oraya buradan yazılamaz.

### 13. Code signing — `user action`

Windows Authenticode sertifikası. İmzasız kurulumda SmartScreen “Windows protected your PC” gösterir. Canlı satışta bu, kod açığından daha görünür. Bu madde sertifikasız kapanmaz. Sertifika bu repoda yok.

Paket ayarı hazır (`electron-builder.win.cjs`, `scripts/pack-win.cjs`):

- `npm run dist` sertifikayı `CSC_LINK` veya `WIN_CSC_LINK` üzerinden kullanır. Dosya yolu ya da Windows certificate store. Parola `CSC_KEY_PASSWORD` veya `WIN_CSC_KEY_PASSWORD`. Hash SHA-256 (`win.signtoolOptions`). DLL uzantısı `signExts` ile imza listesinde. electron-builder 26 `win.signDlls` / kök `signingHashAlgorithms` kabul etmez.
- `npm run dist:test` imzalanmaz. O paket lisansı atlar. Üretim sertifikası o dosyaya yazılmaz.
- `.pfx` ve `.p12` git’e girmez.

Alınacak şey: OV veya EV code signing sertifikası. 2023’ten beri CA bunu düz dosya olarak vermez; USB token veya bulut imzadır. Sertifikadaki ad, alıcının gördüğü publisher adıdır. Parola ve dosya repoda durmaz.

Sertifika gelince `npm run dist`. Kontrol: `Get-AuthenticodeSignature` durumu `Valid`.

SmartScreen itibarı (reputation) imzanın ilk gününde temizlenmeyebilir. İmza, yayıncıyı bilinir yapar. Uyarının tamamen kalkması indirme sayısına bağlıdır.

## Accepted limit

Deneme hakkı kaldırıldı. Lisanssızken Claude çağrısı yok. Ekranda sabit bir örnek rapor durur. Eski `trialUsed` alanı ayar dosyasında kalsa da okunmaz. Lisans Lemon `validate` ile sorulur. Ağ yoksa yerel kayıt kalır. Lemon `valid: false` derse kayıt silinir (`ensureLicenseFresh`).

## Does not apply

Bu maddeler web listesinden. Bu mimaride iş olarak açılmayacaklar.

| İngilizce ad | Neden düştü |
| --- | --- |
| SQL injection | SQL yok. `electron-store` JSON. |
| CSRF | Çerez ve tarayıcı oturumu yok. Karşılığı 1. maddedeki navigasyon kilidi. |
| CORS | Kendi HTTP API'si yok. |
| IDOR / ownership checks | Başka kullanıcının kaydına giden adres yok. |
| Secure cookies | Çerez yok. Sırların karşılığı `safeStorage`. |
| Security headers | HTTP sunucusu yok. Karşılığı Content Security Policy (madde 2). |
| Database security | Sunucu veritabanı yok. Yerel dosya notu madde 12 ve accepted limit. |
| Backup | Sende duran müşteri veritabanı yok. Satın alma kaydı Lemon'da. |
| File upload validation | Sunucuya dosya yüklenmez. Yerel okuma madde 4. |
| HTTPS | Çıkışlar zaten `https://api.anthropic.com` ve `https://api.lemonsqueezy.com`. Checkout `https:` ve `*.lemonsqueezy.com` dışında reddedilir. |
| CI/CD security scanning | CI yok. Tarama madde 8'deki `npm audit`. CI eklenirse audit oraya taşınır. |
| Authentication | Hesap şifresi yok. Karşılığı BYOK anahtarı ve Lemon lisans anahtarı. İkisi de duruyor. |
| Logging / audit logs | Sunucu audit kaydı yok. Yapılmayacak olan: anahtarı veya ham logu konsola basmak (madde 5 ve 11). |

## Nerede

- Kabuk ve tek örnek: `electron/main.cjs`
- Adres kuralı: `electron/shellGuard.cjs`
- Hata temizliği: `electron/errors.cjs`
- Prompt: `electron/prompt.cjs`, çeviri metni `electron/claude.cjs`
- Anahtar: `electron/keyStore.cjs`
- Lisans kapısı: `electron/licenseGate.cjs`
- İçerik politikası: `vite.config.ts` (yalnız production build)
- Paket: `electron-builder.win.cjs`, `scripts/pack-win.cjs`
