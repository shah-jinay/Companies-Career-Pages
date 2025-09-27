import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || ''
const isPages = Boolean(process.env.GITHUB_ACTIONS)
const base = isPages && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
