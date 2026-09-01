import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Die Kataloge liegen bewusst außerhalb des App-Ordners (Repo-Wurzel /daten)
// und wandern unverändert in den Build — eine Quelle für Konzept und Code.
export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ['..'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
