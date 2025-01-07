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
import { Game } from './game.client/internal';
import CountdownTimer, { links as CountdownTimerLinks } from '@/components/countdown-timer';

export const links = () => [
    {
        rel: 'stylesheet',
        href: routeCSS
    },
    ...CountdownTimerLinks,
];

/**
 * Load Game constants and return a promise to load the needed images.
 * This prevents hydration errors, prevents the server from loading the board,
 * and prevents the client from prematurely rendering the board before the Game constants and images are loaded.
 */
export const clientLoader = async () => {
    const response = await fetch('/double-solitaire/settings', { method: 'POST' });
    const { dimensions, ranks, suits, playerTypes } = await response.json();
    Game.dimensions = Object.freeze(dimensions.singleplayer);
    MultiplayerGame.dimensions = Object.freeze(dimensions.multiplayer);
    Game.ranks = Object.freeze(ranks);
    Game.suits = Object.freeze(suits);
    Game.playerTypes = Object.freeze(playerTypes);
    return Promise.all([ getImage(cardSpriteSheet), getImage(feltTexture) ]);
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
    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [done, setDone] = useState(false);

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
    }, [ready]);

    
    const toggleDone = useCallback(() => {
        MultiplayerGame.getInstance().done(!done);
        setReady(!done);
    }, [done])

    useEffect(() => {
        MultiplayerGame.on('create-game', () => { 
            setCreatingGame(false);
            setInGame(true);
        });
        MultiplayerGame.on('join-game', () => setInGame(true));
        MultiplayerGame.on('leave-game', () => {
            setInGame(false);
            setReady(false);
            setDone(false);
            setGameStarted(false);
        });
        MultiplayerGame.on('game-end', () => {
            setInGame(false);
            setReady(false);
            setDone(false);
            setGameStarted(false);
        });
        
        MultiplayerGame.on('ready-up', (ready) => setReady(ready));
        MultiplayerGame.on('set-done', (done) => setDone(done));

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

        MultiplayerGame.on('game-start-timer', ({ time = 0 }) => setTimer(time));
        MultiplayerGame.on('game-start', () => {
            setTimer(0);
            setReady(false);
            setGameStarted(true);
        });

        MultiplayerGame.on('session', (data) => {
            const { games, game, userReady, userDone } = data;

            if (games) {
                setGames(games);
            }
            if (game) {
                setInGame(true);
                setReady(userReady);
                setDone(userDone);

                if (game.started) {
                    setGameStarted(true);
                }
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
                        {timer ? (
                            <CountdownTimer className="bg-[var(--success-color)] text-[var(--invert-font-color)]" initialSeconds={timer} text="Starting In:" />
                        ) : (
                            <UsernameInput className="mt-4" disabled={inGame} />
                        )}
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
                                    {gameStarted ? (
                                        done ? (
                                            <button className="btn btn-primary-invert" onClick={toggleDone}>I'm Not Done</button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={toggleDone}>I'm Done</button>
                                        )
                                    ) : (
                                        ready ? (
                                            <button className="btn btn-primary-invert" onClick={toggleReady} disabled={timer}>Unready</button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={toggleReady} disabled={timer}>Ready Up</button>
                                        )
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