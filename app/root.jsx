import {
  Links,
  Meta,
  Outlet,
  Scripts,
} from "@remix-run/react";

import favicon from '../assets/favicon.ico';
  
import './shared.css';

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
  }
];

export default function App() {
  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}