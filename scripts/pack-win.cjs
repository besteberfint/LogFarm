const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..')
const test = process.argv.includes('--test')
const projectRelease = path.join(root, 'release')
const packOut = path.join(os.tmpdir(), 'logfarm-release')
const maxAttempts = 4

function packEnv(baseEnv, testPack) {
  const env = { ...baseEnv, LOGFARM_TEST_PACK: testPack ? '1' : '' }
  if (testPack) {
    delete env.CSC_LINK
    delete env.WIN_CSC_LINK
    delete env.CSC_KEY_PASSWORD
    delete env.WIN_CSC_KEY_PASSWORD
    delete env.CSC_NAME
    env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
  }
  return env
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  fs.rmSync(dir, { recursive: true, force: true })
}

function packOnce() {
  return spawnSync(
    'npx',
    ['electron-builder', '--win', '--config', path.join(root, 'electron-builder.win.cjs')],
    {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: packEnv(process.env, test),
    },
  )
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function copyInstallers() {
  if (!fs.existsSync(packOut)) {
    throw new Error(`Pack output missing: ${packOut}`)
  }

  rmDir(projectRelease)
  fs.mkdirSync(projectRelease, { recursive: true })

  const names = fs.readdirSync(packOut).filter((name) => name.toLowerCase().endsWith('.exe'))
  if (names.length === 0) {
    throw new Error(`No installer exe in ${packOut}`)
  }
  for (const name of names) {
    fs.copyFileSync(path.join(packOut, name), path.join(projectRelease, name))
  }
}

if (require.main === module) {
  if (test) {
    console.log('Test pack: signing is off. This build skips the license gate.')
  } else if (process.env.WIN_CSC_LINK || process.env.CSC_LINK) {
    console.log('Production pack: Authenticode certificate is set. The installer will be signed.')
  } else {
    console.log(
      'Production pack: no CSC_LINK. A certificate in the Windows certificate store will be used if one is installed. Otherwise the installer stays unsigned and SmartScreen will warn.',
    )
  }

  let lastStatus = 1
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      rmDir(packOut)
    } catch (error) {
      console.warn(`Could not clear ${packOut} (${error.message}). Waiting.`)
      sleep(8000)
      rmDir(packOut)
    }

    const result = packOnce()
    lastStatus = result.status === null ? 1 : result.status
    if (lastStatus === 0) {
      copyInstallers()
      process.exit(0)
    }

    if (attempt < maxAttempts) {
      console.warn(`Packaging failed (attempt ${attempt}/${maxAttempts}). Waiting, then retrying.`)
      sleep(12000)
    }
  }

  process.exit(lastStatus)
}

module.exports = { packEnv }
