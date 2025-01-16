import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import 'dotenv/config'; // Import .env file contents to process.env
import { createServer } from 'http';
import initWebSocketServer from './websocket/server.js';

const viteDevServer =
  process.env.ENVIRONMENT === 'production'
    ? null
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();
app.use(
  viteDevServer
    ? viteDevServer.middlewares
    : express.static('./build/client')
);

const build = viteDevServer
  ? () =>
      viteDevServer.ssrLoadModule(
        'virtual:remix/server-build'
      )
  : await import('./build/server/index.js');

app.all('*', createRequestHandler({ build }));

const httpServer = createServer(app);
initWebSocketServer(httpServer);

httpServer.listen(process.env.PORT, async() => {
  console.log(`App (${process.env.ENVIRONMENT}) listening on http://localhost:${process.env.PORT}`);
});