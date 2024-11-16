import { Suspense } from 'react';
import Board from './board.client';
import cardSpriteSheet from '@images/decksprite.png';
import feltTexture from '@images/tabletopfelt.jpg';
import routeCSS from './styles/route.css?url';
import { Await, useLoaderData } from '@remix-run/react';
import { getImage } from '@/utils/images';

export const links = () => [
    {
        rel: 'stylesheet',
        href: routeCSS
    },
];

export const clientLoader = async () => {
    return Promise.all([ getImage(cardSpriteSheet), getImage(feltTexture) ]);
};

export default function DoubleSolitaire() {
    const imagesPromise = useLoaderData();

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
                <Await resolve={imagesPromise}>
                    <Board/>
                </Await>
            </Suspense>
            <div id="right-sidebar"></div>
            <div id="footer"></div>
        </div>
    );
}