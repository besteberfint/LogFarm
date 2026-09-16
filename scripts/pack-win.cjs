const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..')
const test = process.argv.includes('--test')
const projectRelease = path.join(root, 'release')
const packOut = path.join(os.tmpdir(), 'logfarm-release')
const maxAttempts = 4

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
      env: {
        ...process.env,
        LOGFARM_TEST_PACK: test ? '1' : '',
      },
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
