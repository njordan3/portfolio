import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Board from './game.client/board';
import cardSpriteSheet from '@images/decksprite.png';
import feltTexture from '@images/tabletopfelt.jpg';
import routeCSS from './styles/route.css?url';
import { Await, useLoaderData, useSearchParams } from '@remix-run/react';
import { getImage } from '@/utils/images';
import { SingleplayerGame } from './game.client/singleplayer-game';
import { MultiplayerGame } from './game.client/multiplayer-game';
import GameBrowser from './game-browser';
import HoldButton from '@/components/hold-button';
import GameSettings from './game-settings';
import UsernameInput from './username-input';
import GameUsers from './game-users';

export const links = () => [
    {
        rel: 'stylesheet',
        href: routeCSS
    },
];

export const clientLoader = async () => {
    return await Promise.all([ getImage(cardSpriteSheet), getImage(feltTexture) ]);
};

export default function DoubleSolitaire() {
    const imagesPromise = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();
    const isMultiplayer = useMemo(() => searchParams.get('multiplayer') !== null, [searchParams]);
    const [creatingGame, setCreatingGame] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [connected, setConnected] = useState(false);
    const [ready, setReady] = useState(false);
    const [games, setGames] = useState({});

    const setMode = useCallback((mode = '') => {
        const params = new URLSearchParams();
        if (!isMultiplayer && mode === 'multiplayer') {
            params.set('multiplayer', '1');
            setSearchParams(params);
            MultiplayerGame.getInstance().connect();
        } else if (isMultiplayer && mode !== 'multiplayer') {
            setCreatingGame(false);
            setSearchParams(params);
            if (!inGame) {
                MultiplayerGame.getInstance().disconnect()
            } else {
                MultiplayerGame.getInstance().leaveGame()
                    .then(() => MultiplayerGame.getInstance().disconnect());
            }
        }
    }, [isMultiplayer, setSearchParams, inGame]);

    const leaveGame = useCallback(() => {
        MultiplayerGame.getInstance().leaveGame();
    }, []);

    const toggleReady = useCallback(() => {
        MultiplayerGame.getInstance().readyUp(!ready);
        setReady(!ready);
    }, [ready])

    useEffect(() => {
        MultiplayerGame.on('create-game', () => { 
            setCreatingGame(false);
            setInGame(true);
        });
        MultiplayerGame.on('join-game', () => setInGame(true));
        MultiplayerGame.on('leave-game', () => setInGame(false));
        MultiplayerGame.on('game-end', () => setInGame(false));
        
        MultiplayerGame.on('ready-up', (ready) => setReady(ready));

        MultiplayerGame.on('connect', () => setConnected(true));
        MultiplayerGame.on('disconnect', () => setConnected(false));

        MultiplayerGame.on('update-game-browser', (data) => {
            const { action, gameId, game } = data;
            if (action === 'delete') {
                setGames((prevGames) => {
                    const games = structuredClone(prevGames);
                    delete games[gameId];
                    return games;
                });
            } else {
                setGames((prevGames) => {
                    return { ...prevGames, [gameId]: game };
                });
            }
        });

        MultiplayerGame.on('session', (data) => {
            if (data.games) {
                setGames(data.games);
            }
            if (data.game) {
                setInGame(true);
                setReady(data.ready);
            }
        });

        if (isMultiplayer) {
            MultiplayerGame.getInstance().connect();
        }

        return () => {
            MultiplayerGame.getInstance().disconnect();
        }
    }, []);

    return (
        <div id="board-container">
            <div id="header"></div>
            <div id="left-sidebar">
                <div className="terminal-logo">
                    <div className="logo terminal-prompt">
                        <a href="/" target="_blank" className="no-style">Nicholas Jordan</a>
                    </div>
                </div>
                <button disabled={inGame} className={`btn ${!isMultiplayer ? 'btn-primary' : 'btn-default btn-ghost'}`} onClick={() => setMode()}>Solo</button>
                <button className={`btn ${isMultiplayer ? 'btn-primary' : 'btn-default btn-ghost'}`} onClick={() => setMode('multiplayer')}>Multiplayer</button>
                {isMultiplayer && (
                    <>
                        <UsernameInput className="mt-4" disabled={inGame} />
                        <fieldset className="flex flex-col my-4 min-w-0 h-full">
                        {creatingGame && (
                            <GameSettings />
                        )}
                        {!creatingGame && !inGame && (
                            <GameBrowser games={games} />
                        )}
                        {inGame && (
                            <GameUsers />
                        )}
                        </fieldset>
                    </>
                )}
                <div className='mt-auto mb-4 flex justify-center flex-col'>
                    {isMultiplayer ? (
                        <>
                            {creatingGame && (
                                <>
                                    <button className="btn btn-error w-full" onClick={() => setCreatingGame(false)}>Cancel Game</button>
                                </>
                            )}
                            {!creatingGame && !inGame && (
                                <>
                                    <button className="btn btn-primary-invert" onClick={() => setCreatingGame(true)}>Create Game</button>
                                </>
                            )}
                            {inGame && (
                                <>
                                    {ready ? (
                                        <button className="btn btn-primary-invert" onClick={toggleReady}>Unready</button>
                                    ) : (
                                        <button className="btn btn-primary" onClick={toggleReady}>Ready Up</button>
                                    )}
                                    <HoldButton className="btn btn-error" onComplete={leaveGame} text="Leave Game"/>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <HoldButton
                                className="btn btn-primary-invert"
                                onComplete={() => SingleplayerGame.getInstance().deal()}
                                resetOnComplete={true}
                                text="Restart Game"
                            />
                        </>
                    )}
                </div>
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