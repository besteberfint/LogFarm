const path = require('path')
const { fileURLToPath } = require('url')

// Geliştirmede yalnız Vite. Paketlenmiş uygulamada yalnız kendi index.html.
function isAllowedAppUrl(url, { packaged, appRoot }) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (!packaged) {
    return parsed.protocol === 'http:' && parsed.hostname === 'localhost' && parsed.port === '5173'
  }

  if (parsed.protocol !== 'file:') {
    return false
  }

  let filePath
  try {
    filePath = path.resolve(fileURLToPath(parsed))
  } catch {
    return false
  }

  return filePath === path.resolve(appRoot, 'index.html')
}

module.exports = { isAllowedAppUrl }
