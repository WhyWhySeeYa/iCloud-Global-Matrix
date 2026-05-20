import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import pricingHandler from './api/pricing.js'
import healthHandler from './api/health.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
    {
      name: 'local-pricing-api',
      configureServer(server) {
        const createLocalHandler = (handler, errorMessage) => async (req, res) => {
          const response = {
            status(code) {
              res.statusCode = code
              return this
            },
            setHeader(name, value) {
              res.setHeader(name, value)
              return this
            },
            json(payload) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(payload))
            }
          }

          try {
            await handler(req, response)
          } catch (error) {
            console.error(errorMessage, error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({
              error: errorMessage,
              message: error.message
            }))
          }
        }

        server.middlewares.use('/api/pricing', createLocalHandler(pricingHandler, 'Failed to load pricing data.'))
        server.middlewares.use('/api/health', createLocalHandler(healthHandler, 'Failed to load health status.'))
      }
    }
  ],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          element: ['element-plus'],
          export: ['html2canvas']
        }
      }
    }
  },
})
