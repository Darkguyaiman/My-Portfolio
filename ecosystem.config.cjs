'use strict';

module.exports = {
  apps: [
    {
      name: 'portfolio',
      cwd: __dirname,
      script: 'dist/server.js',
      interpreter: 'node',

      // One fork is the best fit for one vCPU and keeps the in-memory cache coherent.
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,

      // Leave memory for Nginx, MySQL, the OS page cache, and image processing.
      node_args: ['--max-old-space-size=640'],
      max_memory_restart: '768M',

      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,

      time: true,
      merge_logs: true,
      source_map_support: true,
      vizion: false,

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3000',
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3000',
      },
    },
  ],
};
