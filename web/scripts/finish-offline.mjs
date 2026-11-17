// After `vite build --mode offline`: embed the favicon too, then save the result as
// dist-offline/careers-day-offline.html, a single file you can copy anywhere and double-click.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist-offline/index.html', 'utf8')
const icon = readFileSync('dist-offline/favicon.svg')
const out = html.replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${icon.toString('base64')}"`)
writeFileSync('dist-offline/careers-day-offline.html', out)
console.log(`Offline edition: dist-offline/careers-day-offline.html (${Math.round(out.length / 1024)} KB)`)
