import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const devServerHost = process.env.VITE_DEV_SERVER_HOST || "127.0.0.1";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) return "react-vendor";
          if (id.includes("react-router")) return "router";
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n";
          if (id.includes("@phosphor-icons")) return "icons";
          if (
            id.includes("@reown/appkit-ui") ||
            id.includes("@reown/appkit-scaffold-ui") ||
            id.includes("@reown/appkit-pay")
          ) {
            return "wallet-ui";
          }
          if (
            id.includes("@reown/appkit-common") ||
            id.includes("@reown/appkit-controllers") ||
            id.includes("@reown/appkit-polyfills") ||
            id.includes("@reown/appkit-utils") ||
            id.includes("@reown/appkit-wallet")
          ) {
            return "wallet-kit";
          }
          if (id.includes("@reown/appkit")) return "wallet-modal";
          if (id.includes("@walletconnect")) return "walletconnect";
          if (id.includes("wagmi") || id.includes("viem") || id.includes("/ox/")) return "web3-core";
          if (id.includes("@tanstack/react-query")) return "react-query";
          return "vendor";
        },
      },
    },
  },
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
