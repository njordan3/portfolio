import { createRequestHandler } from '@remix-run/express';
import express from 'express';

const app = express();

if (process.env.ENVIRONMENT === 'production') {
  // const build = await import('./index.js');
  // app.all('*', createRequestHandler({ build }));
} else {
  const build = await import('./index.js');
  app.all('*', createRequestHandler({ build }));
  // const viteDevServer = await import('vite').then((vite) =>
  //   vite.createServer({
  //     server: { middlewareMode: true },
  //   })
  // );

  // app.use(viteDevServer.middlewares);

  // const build = () => viteDevServer.ssrLoadModule('virtual:remix/server-build');
  // app.all('*', createRequestHandler({ build }));
}

app.listen(3000, () => {
  console.log('App listening on http://localhost:3000');
});