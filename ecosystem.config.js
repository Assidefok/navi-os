module.exports = {
  apps: [
    {
      name: 'proposals-watcher',
      script: '/home/user/.openclaw/workspace/scripts/proposals-watcher-telegram.js',
      interpreter: 'node',
      interpreterArgs: '--experimental-vm-modules',
      watch: false,
      autorestart: true,
      restart_delay: 1000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        WORKSPACE: '/home/user/.openclaw/workspace'
      }
    }
  ]
}
