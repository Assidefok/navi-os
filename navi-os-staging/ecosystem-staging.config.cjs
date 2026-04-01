module.exports = {
  apps: [
    {
      name: 'navi-os-staging-api',
      script: 'server.js',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-staging',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'navi-os-staging-vite',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 8900',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-staging',
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
