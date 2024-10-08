import { createRequestHandler } from "@remix-run/express";
import express from "express";

console.log('STARTING SERVER');

try {
  console.log('NODE_ENV', process.env.NODE_ENV);
  const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

  console.log('here1');
  const app = express();
  app.use(
    viteDevServer
      ? viteDevServer.middlewares
      : express.static("build/client")
  );

  console.log('here2');
  const build = viteDevServer
    ? () =>
        viteDevServer.ssrLoadModule(
          "virtual:remix/server-build"
        )
    : await import("./index.js");

  console.log('here3');
  app.all("*", createRequestHandler({ build }));

  console.log('here4');
  app.listen(3000, () => {
    console.log("App listening on http://localhost:3000");
  });
} catch (e) {
  console.log('ERROR', JSON.stringify(e));
}
