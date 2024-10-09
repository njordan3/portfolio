import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import 'dotenv/config';

const app = express();
let build = null;

if (process.env.ENVIRONMENT === 'production') {
  build = await import('./index.js');
  app.all('*', createRequestHandler({ build }));
  app.use(express.static('../../static'));
} else {
  const viteDevServer = await import('vite').then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    })
  );

  app.use(viteDevServer.middlewares);

  build = () => viteDevServer.ssrLoadModule('virtual:remix/server-build');
}

app.all('*', createRequestHandler({ build }));

app.listen(3000, () => {
  console.log('App listening on http://localhost:3000');
});