import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Для GitHub Pages: VITE_BASE=/имя-репозитория/ (для сайта user.github.io — "/")
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss()],
});
