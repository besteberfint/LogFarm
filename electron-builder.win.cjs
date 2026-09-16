const os = require('os')
const path = require('path')
const pkg = require('./package.json')

const test = process.env.LOGFARM_TEST_PACK === '1'

module.exports = {
  ...pkg.build,
  artifactName: test
    ? 'LogFarm-Setup-${version}-Test.${ext}'
    : 'LogFarm-Setup-${version}.${ext}',
  directories: {
    ...pkg.build.directories,
    output: path.join(os.tmpdir(), 'logfarm-release'),
  },
  extraResources: test
    ? [
        {
          from: 'build/test-unlock.json',
          to: 'test-unlock.json',
        },
      ]
    : undefined,
}
