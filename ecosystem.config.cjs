module.exports = {
  apps: [
    {
      name: 'cergy-frontend',
      cwd: '/var/www/cergy2026/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/cergy2026/logs/frontend-error.log',
      out_file: '/var/www/cergy2026/logs/frontend-out.log',
      merge_logs: true,
    },
    {
      name: 'cergy-backend',
      cwd: '/var/www/cergy2026/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/cergy2026/logs/backend-error.log',
      out_file: '/var/www/cergy2026/logs/backend-out.log',
      merge_logs: true,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
