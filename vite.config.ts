import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // 只保留 react 插件
  // 防止 Vite 尝试处理 Tauri 相关的代码
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  }
});