import { Suspense } from 'react';
import Board from './board';

import routeCSS from './styles/route.css?url';

export const links = () => [
    {
        rel: 'stylesheet',
        href: routeCSS
    },
];

export default function DoubleSolitaire() {
    return (
        <div id="board-container">
            <div id="header"></div>
            <div id="left-sidebar">
                <div className="terminal-logo">
                    <div className="logo terminal-prompt">
                        <a href="/" target="_blank" className="no-style">Nicholas Jordan</a>
                    </div>
                </div>
                <input type="text" placeholder="Username"></input>
                <button className="btn btn-default btn-ghost">Solo</button>
                <button className="btn btn-default btn-ghost">Multiplayer</button>
            </div>
            <Suspense fallback={'Loading...'}>
                <Board/>
            </Suspense>
            <div id="right-sidebar"></div>
            <div id="footer"></div>
        </div>
    );
}