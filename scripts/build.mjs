// Build runner - clears ELECTRON_RUN_AS_NODE before building
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const isPreview = process.argv.includes('--preview')
const command = isPreview ? 'preview' : 'build'

// Remove the problematic env var
delete process.env.ELECTRON_RUN_AS_NODE

// Run electron-vite
const child = spawn('npx', ['electron-vite', command], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
  shell: true
})

child.on('close', (code) => {
  process.exit(code)
})
