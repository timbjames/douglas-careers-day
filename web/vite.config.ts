import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, proxy API + SignalR calls to the .NET API (dotnet run → http://localhost:5080).
// In Docker, nginx does the same job, so the app always calls relative /api URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5080',
      '/hubs': { target: 'http://localhost:5080', ws: true },
    },
  },
})
