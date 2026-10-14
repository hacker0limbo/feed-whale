import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    // `host: true` listens on every interface (IPv6 `::` with dual-stack where the
    // OS supports it), so all of these reach the dev server:
    //   http://localhost:5173   http://127.0.0.1:5173   http://<your LAN IP>:5173
    // Binding to a single address such as "127.0.0.1" would leave `localhost`
    // fragile on hosts where it resolves to ::1 first, and would make the LAN IP
    // unreachable.  Use `strictPort` so a second instance fails loudly instead of
    // silently drifting to another port.
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: { target: "es2022", assetsInlineLimit: 0 },
});
