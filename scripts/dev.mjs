// Dev runner - clears ELECTRON_RUN_AS_NODE before starting electron-vite
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Remove the problematic env var
delete process.env.ELECTRON_RUN_AS_NODE

// Run electron-vite dev
const child = spawn('npx', ['electron-vite', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
  shell: true
})

child.on('close', (code) => {
  process.exit(code)
})
