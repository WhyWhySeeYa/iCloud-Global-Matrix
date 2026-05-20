import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pricingHandler from './api/pricing.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'local-pricing-api',
      configureServer(server) {
        server.middlewares.use('/api/pricing', async (req, res) => {
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
            await pricingHandler(req, response)
          } catch (error) {
            console.error('Local pricing API failed:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({
              error: 'Failed to load pricing data.',
              message: error.message
            }))
          }
        })
      }
    }
  ],
  server: {
    host: '0.0.0.0',
  },
})
