import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL?.trim()

  if (!apiUrl) {
    throw new Error('[ENV ERROR] A variável VITE_API_URL é obrigatória.')
  }

  let parsedApiUrl
  try {
    parsedApiUrl = new URL(apiUrl)
  } catch {
    throw new Error('[ENV ERROR] VITE_API_URL deve ser uma URL válida.')
  }

  if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
    throw new Error('[ENV ERROR] VITE_API_URL deve utilizar HTTP ou HTTPS.')
  }

  return {
    plugins: [react()],
  }
})
