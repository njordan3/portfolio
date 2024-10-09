import {
    Links,
    Meta,
    Outlet,
    Scripts,
  } from "@remix-run/react";
  
  import './shared.css';

  export const links = () => [
    {
      rel: 'icon',
      href: '/assets/favicon.ico',
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