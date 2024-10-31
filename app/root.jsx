import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";

import favicon from '@images/favicon.ico';
  
import tailWindCSS from './tailwind.css?url';
import terminalDarkCSS from '@styles/terminal-dark.css?url';

export const meta = () => [
  {
    title: 'Nicholas Jordan | Portfolio'
  },
  {
    property: 'og:title',
    content: 'Nicholas Jordan | Portfolio',
  },
  {
    name: 'description',
    content: 'Hey, my name is Nick and I enjoy solving problems.',
  },
];

export const links = () => [
  {
    rel: 'icon',
    href: favicon,
    type: 'image/ico',
  },
  {
    rel: 'stylesheet',
    href: tailWindCSS
  },
  {
    rel: 'stylesheet',
    href: terminalDarkCSS
  }
];

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {/* children will be the root Component, ErrorBoundary, or HydrateFallback */}
        {children}
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  }

  return (
    <>
      <h1>Error!</h1>
      <p>{error?.message ?? "Unknown error"}</p>
    </>
  );
}