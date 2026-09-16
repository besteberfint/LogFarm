export type Language = 'en' | 'tr'

export const LANGUAGES: Language[] = ['en', 'tr']
export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  tr: 'TR',
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
}

// Buradaki errors.* anahtarları ana süreçteki hata kodlarıyla birebir aynı olmalı
// (electron/claude.cjs, electron/keyStore.cjs, electron/main.cjs).
const en = {
  'app.title': 'Log Harvest',
  'app.slogan': 'Harvest the insight. Cut the noise.',
  'app.subtitle':
    'Save your own Claude key, paste a log or drop a file, then analyze. Successful reports stay on this computer.',
  'app.languageLabel': 'Language',
  'app.historyElectronOnly': 'History is only stored in the Electron window.',
  'app.settings': 'Settings',
  'app.backToAnalysis': 'Back',
  'app.settingsTitle': 'Settings',
  'app.bannerKeyMissing': 'No Claude API key saved yet.',
  'app.bannerLocked': 'The trial is used up. Activate a license to keep analyzing.',
  'app.bannerAction': 'Open settings',

  'apiKey.label': 'Claude API key',
  'apiKey.help':
    'Paste the key from the Anthropic Console. Once saved, Windows encrypts it on this machine and it is never shown again.',
  'apiKey.placeholderEmpty': 'sk-ant-...',
  'apiKey.placeholderConfigured': 'Type a new key to replace the saved one',
  'apiKey.save': 'Save',
  'apiKey.clear': 'Remove',
  'apiKey.savedMessage':
    'The key was encrypted and saved on this computer. It is not shown in the text box.',
  'apiKey.clearedMessage': 'The saved key was deleted.',
  'apiKey.statusConfigured': 'Status: a key is saved on this computer.',
  'apiKey.statusMissing':
    'Status: no key saved. You need to save one before analyzing.',
  'apiKey.electronOnly':
    'Saving the API key only works in the Electron window. Start it with npm run electron:dev.',

  'license.label': 'License',
  'license.helpTrial':
    'You get 3 analyses without a license. After that, paste the key from your purchase email.',
  'license.helpLocked':
    'The trial is used up. Buy a license, then paste the key here and press Activate.',
  'license.helpLicensed':
    'This computer is licensed. Remove the key only if you need the seat on another machine.',
  'license.helpDev':
    'This is a test build. The trial and license check are skipped. You still need your own Claude API key.',
  'license.placeholder': 'License key',
  'license.activate': 'Activate',
  'license.remove': 'Remove',
  'license.removeConfirm':
    'Remove the license from this computer? The seat can then be used on another machine.',
  'license.removeConfirmYes': 'Remove',
  'license.removeConfirmNo': 'Cancel',
  'license.buy': 'Buy a license',
  'license.buyHint': '$29 once. Analyses on this computer stay unlimited after Activate.',
  'license.activatedMessage': 'License activated on this computer.',
  'license.clearedMessage': 'The saved license was removed.',
  'license.statusDev': 'Status: this is a test build. The license gate is off.',
  'license.statusLicensed': 'Status: this computer is licensed.',
  'license.statusTrial':
    'Status: {remaining} of {max} trial analyses left. A license key is needed after that.',
  'license.statusLocked':
    'Status: the trial is used up. Activate a license to keep analyzing.',
  'license.electronOnly':
    'License checks only run in the Electron window. Start it with npm run electron:dev.',

  'log.label': 'Log',
  'log.pickFile': 'Choose file',
  'log.placeholder': 'Paste, or drag a .log / .txt file here…',
  'log.dropHere': 'Drop the file',
  'log.charCount': '{count} characters',
  'log.analyze': 'Analyze',
  'log.cancel': 'Cancel',
  'log.loadedFile': 'Loaded file: {name}',
  'log.loadedFileTruncated': 'larger than 2 MB, only the beginning was read',
  'log.loadedFileExtra': 'Several files were dropped; only the first was used.',
  'log.longWarning':
    'Over {limit} characters. Analyze will send the beginning and the end only.',
  'log.licenseLocked': 'The trial is used up. Activate a license to analyze.',

  'report.title': 'Analysis result',
  'report.copyAll': 'Copy all',
  'report.loading': 'Reading the log…',
  'report.loadingHint': 'Claude is writing the report. Press Cancel to stop it.',
  'report.retry': 'Try again',
  'report.source': 'Source: Claude',
  'report.truncated':
    'The log was longer than {limit} characters. Only its beginning and end went to Claude, so lines in the middle may be missing from this report.',
  'report.summary': 'Summary',
  'report.rootCause': 'Root cause',
  'report.steps': 'Steps',
  'report.empty': 'No report yet. Paste a log and press Analyze.',

  'copy.copy': 'Copy',
  'copy.copied': 'Copied',

  'history.title': 'History',
  'history.clearAll': 'Delete all',
  'history.empty': 'No records yet. A successful analysis shows up here automatically.',
  'history.untitled': 'Record',

  'errors.keyMissing':
    'No API key found. Paste your key into the Claude API key field and press Save.',
  'errors.keyInvalid':
    'The API key is invalid or missing. Check the key field, then press Analyze again.',
  'errors.keyFormat':
    'That is not an Anthropic key. It has to start with sk-ant- and contain no quotes or spaces.',
  'errors.keySaveEmpty': 'The key field is empty.',
  'errors.safeStorageUnavailable':
    'Secure key storage is not available in this Windows session. Your user session has to be unlocked.',
  'errors.safeStorageDecrypt':
    'The saved key could not be decrypted. Make sure you are in the same Windows session that saved it.',
  'errors.credit':
    'Your Anthropic balance is empty or billing is restricted. Check credit and payment in the Console.',
  'errors.permission':
    'This API key has no access to Claude. Check the key and organization settings in the Anthropic Console.',
  'errors.modelNotFound':
    'The requested Claude model was not found. The app may need an update.',
  'errors.requestTooLarge':
    'The log is bigger than Claude accepts. Paste a shorter section.',
  'errors.rateLimitWait':
    'Claude rate limit reached. Wait about {seconds} seconds, then press Try again.',
  'errors.rateLimit':
    'Claude quota or rate limit reached. Wait a moment, then press Try again.',
  'errors.overloaded': 'Claude is busy right now. Wait a moment, then press Try again.',
  'errors.serverDown':
    'The Claude service cannot answer right now. Press Try again in a little while.',
  'errors.invalidRequest': 'Claude rejected the request. Shorten the log and try again.',
  'errors.invalidRequestDetail': 'Request rejected: {detail}',
  'errors.requestFailed': 'The Claude request failed ({status}).',
  'errors.requestFailedDetail': 'The Claude request failed ({status}): {detail}',
  'errors.networkDns':
    "Could not resolve Claude's server name. Check your internet or DNS connection.",
  'errors.networkConnect':
    'Could not connect to Claude. Check your internet connection and try again.',
  'errors.networkUnreachable': 'Claude is unreachable. Check your internet connection.',
  'errors.timeout': 'Claude did not answer within 60 seconds. Try again.',
  'errors.responseFormat': "Claude's response was not in the expected format.",
  'errors.emptyResponse': 'Claude returned an empty response.',
  'errors.responseUnreadable': "Claude's response could not be read. Try again.",
  'errors.invalidJson': 'Claude did not return valid JSON. Try again.',
  'errors.incompleteReport':
    "Claude's response is missing the summary, root cause or steps. Try again.",
  'errors.logEmpty': 'Log text is required for an analysis.',
  'errors.analyzeFailed': 'Something went wrong during the analysis.',
  'errors.historyNotFound': 'Record not found.',
  'errors.historyReadFailed': 'History could not be read.',
  'errors.historyClearFailed': 'History could not be deleted.',
  'errors.keyStatusFailed': 'Key status could not be read.',
  'errors.keySaveFailed': 'The key could not be saved.',
  'errors.keyClearFailed': 'The key could not be deleted.',
  'errors.languageUnsupported': 'That language is not supported.',
  'errors.languageReadFailed': 'The language setting could not be read.',
  'errors.languageSaveFailed': 'The language setting could not be saved.',
  'errors.fileEmpty': 'The file is empty. Choose another log file.',
  'errors.fileNotText': 'This does not look like a text file. Try .log, .txt or .json.',
  'errors.fileNoText': 'There is no readable text in the file.',
  'errors.fileReadFailed': 'The file could not be read.',
  'errors.licenseRequired':
    'The {max} trial analyses are used up. Activate a license key to continue.',
  'errors.licenseEmpty': 'The license field is empty.',
  'errors.licenseInvalid': 'That license key is invalid or already used on another machine.',
  'errors.licenseActivationLimit':
    'This license is already active on another computer. Remove it there first, then Activate here.',
  'errors.licenseDisabled': 'This license key has been disabled.',
  'errors.licenseExpired': 'This license key has expired.',
  'errors.licenseApiDetail': 'License check failed: {detail}',
  'errors.licenseNetwork': 'Lemon Squeezy could not be reached. Check your internet connection.',
  'errors.licenseTimeout': 'Lemon Squeezy did not answer in time. Try again.',
  'errors.licenseUnreadable': 'The license server response could not be read.',
  'errors.licenseStatusFailed': 'License status could not be read.',
  'errors.licenseActivateFailed': 'The license could not be activated.',
  'errors.licenseClearFailed': 'The license could not be removed.',
  'errors.licenseBuyFailed': 'The store page could not be opened. Check your browser.',
}

const tr: Record<keyof typeof en, string> = {
  'app.title': 'Log Hasadı',
  'app.slogan': 'Veriyi topla. Gürültüyü ayıkla.',
  'app.subtitle':
    'Kendi Claude anahtarını kaydet, logu yapıştır veya dosya bırak, Analiz Et. Başarılı raporlar bu bilgisayarda tutulur.',
  'app.languageLabel': 'Dil',
  'app.historyElectronOnly': 'Geçmiş yalnızca Electron penceresinde saklanır.',
  'app.settings': 'Ayarlar',
  'app.backToAnalysis': 'Geri',
  'app.settingsTitle': 'Ayarlar',
  'app.bannerKeyMissing': 'Kayıtlı Claude API anahtarı yok.',
  'app.bannerLocked': 'Deneme hakkı bitti. Analize devam için lisansı etkinleştir.',
  'app.bannerAction': 'Ayarları aç',

  'apiKey.label': 'Claude API anahtarı',
  'apiKey.help':
    'Anthropic Console’dan aldığın anahtarı buraya yapıştır. Kaydet’ten sonra Windows bu makinede şifreler; anahtar tekrar ekranda gösterilmez.',
  'apiKey.placeholderEmpty': 'sk-ant-...',
  'apiKey.placeholderConfigured': 'Yeni anahtar yazarak değiştirebilirsin',
  'apiKey.save': 'Kaydet',
  'apiKey.clear': 'Kaldır',
  'apiKey.savedMessage':
    'Anahtar bu bilgisayarda şifrelenerek kaydedildi. Metin kutusunda görünmez.',
  'apiKey.clearedMessage': 'Kayıtlı anahtar silindi.',
  'apiKey.statusConfigured': 'Durum: bu bilgisayarda kayıtlı anahtar var.',
  'apiKey.statusMissing': 'Durum: kayıtlı anahtar yok. Analiz için kaydetmen gerekir.',
  'apiKey.electronOnly':
    'API anahtarı kaydı yalnızca Electron penceresinde çalışır. npm run electron:dev ile aç.',

  'license.label': 'Lisans',
  'license.helpTrial':
    'Lisans olmadan 3 analiz hakkın var. Sonrasında satın alma e-postasındaki anahtarı yapıştır.',
  'license.helpLocked':
    'Deneme hakkı bitti. Lisans al, anahtarı buraya yapıştır ve Etkinleştir’e bas.',
  'license.helpLicensed':
    'Bu bilgisayar lisanslı. Anahtarı yalnızca başka bir makinede kullanacaksan kaldır.',
  'license.helpDev':
    'Bu bir test sürümü. Deneme ve lisans kontrolü atlanır. Yine de kendi Claude API anahtarın gerekir.',
  'license.placeholder': 'Lisans anahtarı',
  'license.activate': 'Etkinleştir',
  'license.remove': 'Kaldır',
  'license.removeConfirm':
    'Lisans bu bilgisayardan kaldırılsın mı? Koltuk o zaman başka bir makinede kullanılabilir.',
  'license.removeConfirmYes': 'Kaldır',
  'license.removeConfirmNo': 'Vazgeç',
  'license.buy': 'Lisans al',
  'license.buyHint': '29$, tek sefer. Etkinleştir’den sonra bu bilgisayarda analiz sınırsız.',
  'license.activatedMessage': 'Lisans bu bilgisayarda etkinleştirildi.',
  'license.clearedMessage': 'Kayıtlı lisans kaldırıldı.',
  'license.statusDev': 'Durum: bu bir test sürümü. Lisans kontrolü kapalı.',
  'license.statusLicensed': 'Durum: bu bilgisayar lisanslı.',
  'license.statusTrial':
    'Durum: {max} denemeden {remaining} analiz kaldı. Sonrasında lisans gerekir.',
  'license.statusLocked':
    'Durum: deneme hakkı bitti. Analize devam için lisansı etkinleştir.',
  'license.electronOnly':
    'Lisans kontrolü yalnızca Electron penceresinde çalışır. npm run electron:dev ile aç.',

  'log.label': 'Log',
  'log.pickFile': 'Dosya seç',
  'log.placeholder': 'Yapıştır veya .log / .txt dosyasını buraya sürükle…',
  'log.dropHere': 'Dosyayı bırak',
  'log.charCount': '{count} karakter',
  'log.analyze': 'Analiz Et',
  'log.cancel': 'İptal',
  'log.loadedFile': 'Yüklenen dosya: {name}',
  'log.loadedFileTruncated': '2 MB’den büyüktü, yalnızca başı okundu',
  'log.loadedFileExtra': 'Birden fazla dosya bırakıldı; yalnızca ilki alındı.',
  'log.longWarning':
    '{limit} karakteri aştı. Analiz Et yalnızca başı ve sonu gönderecek.',
  'log.licenseLocked': 'Deneme hakkı bitti. Analiz için lisansı etkinleştir.',

  'report.title': 'Analiz sonucu',
  'report.copyAll': 'Tümünü kopyala',
  'report.loading': 'Log inceleniyor…',
  'report.loadingHint': 'Claude raporu hazırlıyor. İptal ile durdurabilirsin.',
  'report.retry': 'Tekrar dene',
  'report.source': 'Kaynak: Claude',
  'report.truncated':
    'Log {limit} karakterden uzundu. Claude’a yalnızca başı ve sonu gönderildi; ortadaki satırlar bu rapora yansımamış olabilir.',
  'report.summary': 'Özet',
  'report.rootCause': 'Kök neden',
  'report.steps': 'Çözüm adımları',
  'report.empty': 'Henüz rapor yok. Log yapıştırıp Analiz Et’e bas.',

  'copy.copy': 'Kopyala',
  'copy.copied': 'Kopyalandı',

  'history.title': 'Geçmiş',
  'history.clearAll': 'Tümünü sil',
  'history.empty': 'Henüz kayıt yok. Başarılı bir analiz otomatik burada görünür.',
  'history.untitled': 'Kayıt',

  'errors.keyMissing':
    'API anahtarı bulunamadı. Claude API anahtarı alanına yapıştırıp Kaydet’e bas.',
  'errors.keyInvalid':
    'API anahtarı geçersiz veya eksik. Anahtar alanını kontrol et, sonra Analiz Et’e tekrar bas.',
  'errors.keyFormat':
    'Bu bir Anthropic anahtarı değil. sk-ant- ile başlamalı; tırnak ve boşluk olmamalı.',
  'errors.keySaveEmpty': 'Anahtar alanı boş.',
  'errors.safeStorageUnavailable':
    'Bu Windows oturumunda güvenli anahtar saklama kullanılamıyor. Kullanıcı oturumunun kilidi açık olmalı.',
  'errors.safeStorageDecrypt':
    'Kayıtlı anahtar çözülemedi. Anahtarı kaydettiğin Windows oturumunda olduğundan emin ol.',
  'errors.credit':
    'Anthropic bakiyen bitmiş veya fatura kısıtı var. Console’da kredi ve ödeme durumunu kontrol et.',
  'errors.permission':
    'Bu API anahtarının Claude’a erişim izni yok. Anthropic Console’daki anahtar ve organizasyon ayarlarını kontrol et.',
  'errors.modelNotFound':
    'İstenen Claude modeli bulunamadı. Uygulama güncellemesi gerekebilir.',
  'errors.requestTooLarge':
    'Log Claude’un kabul ettiği boyutu aştı. Daha kısa bir bölüm yapıştır.',
  'errors.rateLimitWait':
    'Claude hız limiti doldu. Yaklaşık {seconds} saniye bekleyip Tekrar dene’ye bas.',
  'errors.rateLimit':
    'Claude kotası veya hız limiti doldu. Biraz bekleyip Tekrar dene’ye bas.',
  'errors.overloaded': 'Claude şu an yoğun. Biraz bekleyip Tekrar dene’ye bas.',
  'errors.serverDown':
    'Claude servisi şu an yanıt veremiyor. Biraz sonra Tekrar dene’ye bas.',
  'errors.invalidRequest': 'Claude isteği reddetti. Logu kısaltıp tekrar dene.',
  'errors.invalidRequestDetail': 'İstek reddedildi: {detail}',
  'errors.requestFailed': 'Claude isteği başarısız ({status}).',
  'errors.requestFailedDetail': 'Claude isteği başarısız ({status}): {detail}',
  'errors.networkDns':
    'Claude sunucusunun adı çözülemedi. İnternet veya DNS bağlantını kontrol et.',
  'errors.networkConnect':
    'Claude’a bağlanılamadı. İnternetini kontrol edip tekrar dene.',
  'errors.networkUnreachable': 'Claude’a ulaşılamadı. İnternet bağlantını kontrol et.',
  'errors.timeout': 'Claude 60 saniye içinde yanıt vermedi. Tekrar dene.',
  'errors.responseFormat': 'Claude yanıtı beklenen biçimde değil.',
  'errors.emptyResponse': 'Claude boş yanıt döndü.',
  'errors.responseUnreadable': 'Claude yanıtı okunamadı. Tekrar dene.',
  'errors.invalidJson': 'Claude geçerli JSON döndürmedi. Tekrar dene.',
  'errors.incompleteReport':
    'Claude yanıtında özet, kök neden veya adımlar eksik. Tekrar dene.',
  'errors.logEmpty': 'Analiz için log metni gerekli.',
  'errors.analyzeFailed': 'Analiz sırasında bir şeyler ters gitti.',
  'errors.historyNotFound': 'Kayıt bulunamadı.',
  'errors.historyReadFailed': 'Geçmiş okunamadı.',
  'errors.historyClearFailed': 'Geçmiş silinemedi.',
  'errors.keyStatusFailed': 'Anahtar durumu okunamadı.',
  'errors.keySaveFailed': 'Anahtar kaydedilemedi.',
  'errors.keyClearFailed': 'Anahtar silinemedi.',
  'errors.languageUnsupported': 'Bu dil desteklenmiyor.',
  'errors.languageReadFailed': 'Dil ayarı okunamadı.',
  'errors.languageSaveFailed': 'Dil ayarı kaydedilemedi.',
  'errors.fileEmpty': 'Dosya boş. Başka bir log dosyası seç.',
  'errors.fileNotText': 'Bu dosya metin gibi durmuyor. .log, .txt veya .json dene.',
  'errors.fileNoText': 'Dosyada okunacak metin yok.',
  'errors.fileReadFailed': 'Dosya okunamadı.',
  'errors.licenseRequired':
    '{max} deneme analizi doldu. Devam etmek için bir lisans anahtarı etkinleştir.',
  'errors.licenseEmpty': 'Lisans alanı boş.',
  'errors.licenseInvalid': 'Bu lisans anahtarı geçersiz veya başka bir makinede kullanılmış.',
  'errors.licenseActivationLimit':
    'Bu lisans başka bir bilgisayarda açık. Önce orada kaldır, sonra burada Etkinleştir.',
  'errors.licenseDisabled': 'Bu lisans anahtarı kapatılmış.',
  'errors.licenseExpired': 'Bu lisans anahtarının süresi dolmuş.',
  'errors.licenseApiDetail': 'Lisans kontrolü başarısız: {detail}',
  'errors.licenseNetwork': 'Lemon Squeezy’ye ulaşılamadı. İnternet bağlantını kontrol et.',
  'errors.licenseTimeout': 'Lemon Squeezy zamanında yanıt vermedi. Tekrar dene.',
  'errors.licenseUnreadable': 'Lisans sunucusu yanıtı okunamadı.',
  'errors.licenseStatusFailed': 'Lisans durumu okunamadı.',
  'errors.licenseActivateFailed': 'Lisans etkinleştirilemedi.',
  'errors.licenseClearFailed': 'Lisans kaldırılamadı.',
  'errors.licenseBuyFailed': 'Mağaza sayfası açılamadı. Tarayıcını kontrol et.',
}

export type TranslationKey = keyof typeof en

export const translations: Record<Language, Record<TranslationKey, string>> = { en, tr }
