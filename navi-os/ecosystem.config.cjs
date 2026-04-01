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
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 8100',
      cwd: '/home/user/.openclaw/workspace/navi-os',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000
    }
  ]
};
