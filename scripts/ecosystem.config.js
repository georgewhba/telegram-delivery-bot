module.exports = {
  apps: [
    {
      name: "delivery-bot",
      script: "./dist/index.js",
      cwd: __dirname + "/..",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      time: true,
    },
  ],
};
