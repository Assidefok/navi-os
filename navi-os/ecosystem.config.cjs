module.exports = {
  apps: [
    {
      name: 'navi-os-api',
      script: 'server.js',
      cwd: '/home/user/.openclaw/workspace/navi-os',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    },
    {
      name: 'navi-os-vite',
      script: 'server.js',
      cwd: '/home/user/.openclaw/workspace/navi-os',
      env: {
        NODE_ENV: 'production',
        PORT: 8100
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    }
  ]
};
