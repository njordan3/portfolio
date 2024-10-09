import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

let build = null;
if (process.env.NODE_ENV === 'production') {
  build = await import('./index.js');
  
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