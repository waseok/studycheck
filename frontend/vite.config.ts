import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // 프록시 요청 시 모든 헤더 전달 (Authorization 포함)
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 원본 요청의 모든 헤더를 프록시 요청에 복사
            const headers = req.headers
            if (headers.authorization) {
              proxyReq.setHeader('Authorization', headers.authorization)
            }
            if (headers['content-type']) {
              proxyReq.setHeader('Content-Type', headers['content-type'])
            }
          })
        },
      },
    },
  },
})

