import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `base` must match how the site is served.
 *
 * On GitHub Pages a project site lives at /<repo-name>/, so the default below
 * is '/across-the-hall/'. A department that forks this under a different repo
 * name should set VITE_BASE (the deploy workflow does this automatically), and
 * anyone serving from a domain root can set VITE_BASE=/ instead.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/across-the-hall/',
  plugins: [react()]
})
