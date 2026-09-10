import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.NASA_API_KEY || process.env.NASA_API_KEY || 'DEMO_KEY';
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'apod-dev-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/apod')) {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost:3000');
                if (!parsedUrl.searchParams.has('api_key')) {
                  parsedUrl.searchParams.set('api_key', apiKey);
                }
                const nasaUrl = `https://api.nasa.gov/planetary/apod${parsedUrl.search}`;
                const response = await fetch(nasaUrl);
                const data = await response.text();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = response.status;
                res.end(data);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      cors: true,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
