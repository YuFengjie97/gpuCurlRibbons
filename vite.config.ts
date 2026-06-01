import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import threeUniformGui from "tsl-uniform-ui-vite-plugin";

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_URL

  console.log('🧊 env', env.NODE_ENV);
  console.log('🧠 base', env.VITE_BASE_URL);

  return {
    base,
    plugins: [threeUniformGui({
      persistent: false, // Save configurations in localStorage
      devOnly: false, // Only active in development mode (default)
      presets: true, // Enable the presets feature
      draggable: true, // Make the panel draggable
    })],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  }
});