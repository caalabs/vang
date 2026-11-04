import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// `npm run lan` serves over HTTPS on the wifi so an iPhone gets a secure context (clipboard, share, crypto.randomUUID)
export default defineConfig({
  base: './', // relative paths: works at a domain root and under GitHub Pages /tts-app/
  plugins: [react(), tailwindcss(), ...(process.env.LAN ? [basicSsl()] : [])],
})
