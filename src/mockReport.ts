import type { AnalysisReport } from './types'

// Yalnızca tarayıcıda (npm run dev) düzen denemek için; Claude'a hiç gitmez.
export const MOCK_REPORT: AnalysisReport = {
  summary: 'The app fails because it cannot reach the expected service (mock summary).',
  rootCause:
    'The target service is down, the host/port is wrong, or there is no network access. This text is a fixed sample, not an API response.',
  steps: [
    'Check that the host and port in the error message are correct.',
    'Verify that the service (database, API, and so on) is running.',
    'Review local environment variables and connection settings.',
  ],
}

export const MOCK_REPORT_TR: AnalysisReport = {
  summary: 'Uygulama beklenen servise ulaşamadığı için başarısız oluyor (örnek özet).',
  rootCause:
    'Hedef servis kapalı, host veya port yanlış, ya da ağ erişimi yok. Bu metin sabit bir örnektir, API yanıtı değildir.',
  steps: [
    'Hata iletisindeki host ve port değerlerinin doğru olduğunu kontrol et.',
    'Servisin (veritabanı, API ve benzeri) çalıştığını doğrula.',
    'Yerel ortam değişkenlerini ve bağlantı ayarlarını gözden geçir.',
  ],
}

export const MOCK_REPORTS = {
  en: MOCK_REPORT,
  tr: MOCK_REPORT_TR,
} as const
