import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /auth/* and /player/* to the gateway
      "/auth": "http://localhost:3000",
      "/player": "http://localhost:3000",
    },
  },
});
