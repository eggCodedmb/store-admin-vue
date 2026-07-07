import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "INVALID_ANNOTATION") return
        warn(warning)
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/vue") || id.includes("node_modules/pinia") || id.includes("node_modules/vue-router")) {
            return "vue-vendor"
          }
          if (id.includes("node_modules/element-plus")) {
            return "element-plus"
          }
          if (id.includes("node_modules/echarts")) {
            return "echarts"
          }
        }
      }
    }
  }
})
