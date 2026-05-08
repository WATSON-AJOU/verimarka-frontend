import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const devServerHost = process.env.VITE_DEV_SERVER_HOST || "127.0.0.1";

export default defineConfig({
  plugins: [react()],
  server: {
    host: devServerHost,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
