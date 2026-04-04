module.exports = {
  apps: [
    {
      name: 'navi-os-final-api',
      script: 'server.js',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-final',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'navi-os-final-vite',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 9100',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-final',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
