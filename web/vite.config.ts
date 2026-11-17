import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  // `npm run build:offline`: one self-contained HTML file (code, styles, fonts and logos all
  // inlined) that runs by double-clicking it, with no server. See .env.offline.
  if (mode === 'offline') {
    return {
      plugins: [react(), viteSingleFile()],
      base: './',
      build: { outDir: 'dist-offline', emptyOutDir: true },
    }
  }

  // Normal build. In dev, proxy API + SignalR calls to the .NET API (dotnet run → http://localhost:5080).
  // In Docker, nginx does the same job, so the app always calls relative /api URLs.
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:5080',
        '/hubs': { target: 'http://localhost:5080', ws: true },
      },
    },
  }
})
