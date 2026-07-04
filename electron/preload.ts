import { contextBridge } from 'electron'

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})
