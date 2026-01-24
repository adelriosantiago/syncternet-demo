const pkg = require('./package.json')

module.exports = {
  apps: [
    {
      name: `${pkg.name}`,
      script: 'npm',
      args: 'run start',
      instances: 1,
    },
  ],
}
