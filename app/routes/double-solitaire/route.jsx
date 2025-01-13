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
import { Card, Game, Hand, Stack, Tableau } from './game.client/internal';
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

    Card.width = dimensions.singleplayer.cardWidth;
    Card.height = dimensions.singleplayer.cardHeight;
    Stack.margin = dimensions.singleplayer.cardMargin;
    Hand.xOffset = dimensions.singleplayer.cardXOffset;
    Tableau.yOffset = dimensions.singleplayer.cardYOffset;

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
    const [playerType, setPlayerType] = useState(null);
    const [connected, setConnected] = useState(false);
    const [ready, setReady] = useState(false);
    const [games, setGames] = useState({});
    const [timer, setTimer] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [done, setDone] = useState(false);
    const [voteRestart, setVoteRestart] = useState(false);
    const [lastGameStats, setLastGameStats] = useState(null);

    const setMode = useCallback((mode = '') => {
        const params = new URLSearchParams();
        if (!isMultiplayer && mode === 'multiplayer') {
            params.set('multiplayer', '1');
            setSearchParams(params);
            MultiplayerGame.getInstance().connect();
        } else if (isMultiplayer && mode !== 'multiplayer') {
            setCreatingGame(false);
            setSearchParams(params);
            if (playerType !== null) {
                MultiplayerGame.getInstance().disconnect()
            } else {
                MultiplayerGame.getInstance().leaveGame()
                    .then(() => MultiplayerGame.getInstance().disconnect());
            }
        }
    }, [isMultiplayer, setSearchParams, playerType]);

    const leaveGame = useCallback(() => {
        MultiplayerGame.getInstance().leaveGame();
    }, []);

    const toggleReady = useCallback(() => {
        setReady((prev) => {
            MultiplayerGame.getInstance().handleToggleFlag(!prev, 'ready');
            return !prev;
        });
    }, [ready]);

    const toggleDone = useCallback(() => {
        setDone((prev) => {
            MultiplayerGame.getInstance().handleToggleFlag(!prev, 'done');
            return !prev;
        });
    }, [done]);

    const toggleVoteRestart = useCallback(() => {
        setVoteRestart((prev) => {
            MultiplayerGame.getInstance().handleToggleFlag(!prev, 'voteRestart');
            return !prev;
        });
    }, [voteRestart]);

    useEffect(() => {
        MultiplayerGame.on('create-game', () => { 
            setCreatingGame(false);
            setPlayerType(Game.playerTypes.OWNER);
        });
        MultiplayerGame.on('join-game', (playerType) => {
            setPlayerType(playerType);
        });
        MultiplayerGame.on('leave-game', () => {
            setLastGameStats(null);
            setPlayerType(null);
            setReady(false);
            setDone(false);
            setGameStarted(false);
            setVoteRestart(false);
        });
        MultiplayerGame.on('game-end', (stats) => {
            setLastGameStats(stats);
            setPlayerType(null);
            setReady(false);
            setDone(false);
            setGameStarted(false);
            setVoteRestart(false);
        });
        MultiplayerGame.on('game-complete', (stats) => {
            setLastGameStats(stats);
            setReady(false);
            setDone(false);
            setGameStarted(false);
            setVoteRestart(false);
        });
        MultiplayerGame.on('game-restart', (data) => {
            setLastGameStats(null);
            setVoteRestart(false);
        });
        
        MultiplayerGame.on('toggle-flag', ({ flag, toggle }) => {
            switch(flag) {
                case 'ready':
                    setReady(toggle);
                    break;
                case 'done':
                    setDone(toggle);
                    break;
                case 'voteRestart':
                    setVoteRestart(toggle);
                    break;
            }
        });

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
            const { games, game, userReady, userDone, playerType } = data;

            if (games) {
                setGames(games);
            }
            if (game) {
                setPlayerType(playerType);
                setReady(userReady);
                setDone(userDone);

                if (game.started) {
                    setGameStarted(true);
                }
                if (game.stats) {
                    setLastGameStats(game.stats);
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
                    <div className="logo terminal-prompt select-none">
                        <a href="/" target="_self" className="no-style">Nicholas Jordan</a>
                    </div>
                </div>
                <button disabled={playerType !== null} className={`btn ${!isMultiplayer ? 'btn-primary' : 'btn-default btn-ghost'}`} onClick={() => setMode()}>Solo</button>
                <button className={`btn ${isMultiplayer ? 'btn-primary' : 'btn-default btn-ghost'}`} onClick={() => setMode('multiplayer')}>Multiplayer</button>
                {isMultiplayer && (
                    <>
                        {timer ? (
                            <CountdownTimer className="bg-[var(--success-color)] text-[var(--invert-font-color)]" initialSeconds={timer} text="Starting In:" />
                        ) : (
                            <UsernameInput className="mt-4 select-none" disabled={playerType !== null} />
                        )}
                        <fieldset className="flex flex-col my-4 min-w-0 h-full select-none">
                        {creatingGame && (
                            <GameSettings />
                        )}
                        {!creatingGame && playerType === null && !lastGameStats && (
                            <GameBrowser games={games} />
                        )}
                        {playerType !== null && (
                            <GameUsers />
                        )}
                        {!creatingGame && lastGameStats && (
                            <>
                                <fieldset className="flex flex-col my-4 min-w-0">
                                    <legend>Game Stats</legend>
                                    {!lastGameStats.winner ? (
                                        <p>You Tied</p>
                                    ) : (
                                        lastGameStats.stats[lastGameStats.winner].me ? (
                                            <p>You Won!</p>
                                        ) : (
                                            <p>You Lost</p>
                                        )
                                    )}
                                    {Object.keys(lastGameStats.stats).map((userId) => {
                                        const { name, score, me } = lastGameStats.stats[userId];
                                        return (
                                            <div key={userId} className={`${!me ? 'text-[var(--secondary-color)]' : ''} flex flex-row text-nowrap`}>
                                                <p className="my-1 text-xs truncate">{name}</p>
                                                <p className="my-1 text-xs">: {score}</p>
                                            </div>
                                        );
                                    })}
                                </fieldset>
                                {playerType === null && (
                                    <button className="btn btn-error" onClick={() => setLastGameStats(null)}>Hide Stats</button>
                                )}
                            </>
                        )}
                        </fieldset>
                    </>
                )}
                <div className='mt-auto mb-4 flex justify-center flex-col'>
                    {isMultiplayer ? (
                        <>
                            {creatingGame && (
                                <button className="btn btn-error" onClick={() => setCreatingGame(false)}>Cancel Game</button>
                            )}
                            {!creatingGame && playerType === null && (
                                <button className="btn btn-primary-invert" onClick={() => setCreatingGame(true)}>Create Game</button>
                            )}
                            {!creatingGame && playerType !== null && (
                                <>
                                    {gameStarted && !lastGameStats && (
                                        done ? (
                                            <button className="btn btn-primary-invert" onClick={toggleDone}>I'm Not Done</button>
                                        ) : (
                                            <HoldButton className="btn btn-primary" onComplete={toggleDone} holdTime={0.5} text="I'm Done"/>
                                        )
                                    )}
                                    {!gameStarted && !lastGameStats && (
                                        ready ? (
                                            <button className="btn btn-primary-invert" onClick={toggleReady} disabled={timer}>Unready</button>
                                        ) : (
                                            <HoldButton className="btn btn-primary" onComplete={toggleReady} disabled={timer} holdTime={0.5} text="Ready Up"/>
                                        )
                                    )}
                                    {!gameStarted && lastGameStats && (
                                        <HoldButton className="btn btn-primary" onComplete={toggleVoteRestart} disabled={voteRestart} holdTime={0.5} text="Play Again?"/>
                                    )}
                                    <HoldButton className="btn btn-error mt-4" onComplete={leaveGame} text="Leave Game"/>
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