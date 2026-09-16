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
