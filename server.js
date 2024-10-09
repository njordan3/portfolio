import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import * as build from "./index.js";

const app = express();

if (process.env.NODE_ENV === 'production') {
  // const build = await import('index.js');
  
} else {
  const viteDevServer = await import('vite').then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    })
  );

  app.use(viteDevServer.middlewares);

  const build = () => viteDevServer.ssrLoadModule('virtual:remix/server-build');
  app.all('*', createRequestHandler({ build }));
}

app.all('*', createRequestHandler({ build }));

app.listen(3000, () => {
  console.log('App listening on http://localhost:3000');
});