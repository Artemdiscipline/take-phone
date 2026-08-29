import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Отдельная конфигурация для тестов.
 *
 * Основной `vite.config.ts` поднимает workerd через плагин Cloudflare, что для
 * юнит-тестов доменной логики не нужно. Здесь достаточно алиаса `@`.
 */
export default defineConfig({
  resolve: {
    alias: {
      // `next/headers` живёт только в рантайме Next — в юнит-тестах подменяем.
      'next/headers': fileURLToPath(new URL('./tests/stubs/next-headers.ts', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
