import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The ONNX graph and its label list are served as plain files from /models;
  // never inline them so the class ordering stays a readable artifact.
  build: { assetsInlineLimit: 0 },
  optimizeDeps: { exclude: ["onnxruntime-web"] },
});
