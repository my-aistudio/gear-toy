import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // 确保 CSS 也内联
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // 强制内联所有资源
  },
})
