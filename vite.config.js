import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function apiMiddlewarePlugin() {
  return {
    name: 'vercel-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            const url = new URL(req.url, 'http://localhost');
            const routeName = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
            const handlerPath = `./api/${routeName}.js`;

            if (!res.status) {
              res.status = function (statusCode) {
                this.statusCode = statusCode;
                return this;
              };
            }
            if (!res.json) {
              res.json = function (data) {
                this.setHeader('Content-Type', 'application/json');
                this.end(JSON.stringify(data));
                return this;
              };
            }

            const module = await import(`${handlerPath}?t=${Date.now()}`);
            if (module && typeof module.default === 'function') {
              req.query = Object.fromEntries(url.searchParams.entries());
              return await module.default(req, res);
            }
          } catch (err) {
            console.error(`[API Dev Error] ${req.url}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
});
