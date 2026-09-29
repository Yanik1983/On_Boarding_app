/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { CONTENT_DIR, readRawContent, renderContentBlock, validateRawContent } from './tools/content'

/** Embeds the editable content block into index.html (dev and build). */
function onboardingContent(isBuild: boolean): Plugin {
  return {
    name: 'onboarding-content',
    transformIndexHtml(html) {
      const raw = readRawContent()
      const problems = validateRawContent(raw)
      if (problems.length && isBuild) {
        throw new Error(`Content is not valid:\n - ${problems.join('\n - ')}`)
      }
      return html.replace('<!--ONBOARDING_CONTENT-->', renderContentBlock(raw))
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('change', (file) => {
        if (file.startsWith(CONTENT_DIR) && file.endsWith('.json')) server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

/** Copies the built page to a clearly named, versioned file that can be shared. */
function namedCopy(): Plugin {
  return {
    name: 'named-single-file',
    apply: 'build',
    closeBundle() {
      const { meta } = readRawContent()
      const source = path.resolve('dist/index.html')
      if (!fs.existsSync(source)) return
      const target = path.resolve(`dist/JnJ-MedTech-Onboarding-v${String(meta.version)}.html`)
      fs.copyFileSync(source, target)
      const sizeMb = (fs.statSync(target).size / 1024 / 1024).toFixed(2)
      console.log(`\n  Single-file app: ${path.relative(process.cwd(), target)} (${sizeMb} MB)\n`)
    },
  }
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    react(),
    onboardingContent(command === 'build'),
    ...(command === 'build' ? [viteSingleFile({ removeViteModuleLoader: true }), namedCopy()] : []),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 6000,
    reportCompressedSize: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
}))
