import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import 'dotenv/config'; // Import .env file contents to process.env

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
    : express.static('../../static')
);

const build = viteDevServer
  ? () =>
      viteDevServer.ssrLoadModule(
        'virtual:remix/server-build'
      )
  : await import('./index.js');

app.all('*', createRequestHandler({ build }));

app.listen(3000, () => {
  console.log('App listening on http://localhost:3000');
});