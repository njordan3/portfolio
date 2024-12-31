import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Board from './game.client/board';
import cardSpriteSheet from '@images/decksprite.png';
import feltTexture from '@images/tabletopfelt.jpg';
import routeCSS from './styles/route.css?url';
import { Await, Form, useLoaderData, useSearchParams } from '@remix-run/react';
import { getImage } from '@/utils/images';
import { SingleplayerGame } from './game.client/singleplayer-game';
import { MultiplayerGame } from './game.client/multiplayer-game';
import GameBrowser from './game-browser';
import HoldButton from '@/components/hold-button';

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
    const [username, setUsername] = useState('');
    const [creatingGame, setCreatingGame] = useState(false);
    const [gameName, setGameName] = useState('');
    const [inGame, setInGame] = useState(false);
    const [connected, setConnected] = useState(false);
    const [games, setGames] = useState({});

    const setMode = useCallback((mode = '') => {
        const params = new URLSearchParams();
        if (!isMultiplayer && mode === 'multiplayer') {
            params.set('multiplayer', '1');
            setSearchParams(params);
            MultiplayerGame.getInstance().connect();
        } else if (isMultiplayer && mode !== 'multiplayer') {
            // confirm with user before leaving
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

    const onUsernameChange = useCallback((e) => {
        const { value } = e.target;
        setUsername(value);
        MultiplayerGame.getInstance().username = value;
    }, [setUsername]);

    const createGame = useCallback(() => {
        MultiplayerGame.getInstance().createGame(gameName);
    }, [gameName]);

    const leaveGame = useCallback(() => {
        MultiplayerGame.getInstance().leaveGame();
    }, []);

    const updateGame = useCallback((game) => {
        setGames({ ...games, ...game });
    }, [games, setGames]);

    const deleteGame = useCallback((gameId) => {
        const existingGames = structuredClone(games);
        delete existingGames[gameId];
        setGames(existingGames);
    }, [games, setGames]);

    useEffect(() => {
        MultiplayerGame.on('update-game-browser', (data) => {
            const { action, gameId, game } = data;
            if (action === 'delete') {
                deleteGame(gameId);
            } else {
                updateGame({ [gameId]: game });
            }
        });

        MultiplayerGame.on('session', (data) => {
            setGames(data.games);
        });
    }, [games, setGames, updateGame, deleteGame]);

    useEffect(() => {
        const username = localStorage.getItem('username') ?? '';
        setUsername(username);
        MultiplayerGame.getInstance().username = username;
        
        MultiplayerGame.on('create-game', () => {
            setCreatingGame(false);
            setInGame(true);
        });
        MultiplayerGame.on('join-game', () => setInGame(true));
        MultiplayerGame.on('leave-game', () => setInGame(false));
        MultiplayerGame.on('game-end', () => setInGame(false));

        MultiplayerGame.on('connect', () => setConnected(true));
        MultiplayerGame.on('disconnect', () => setConnected(false));

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
                        <div className="mt-4">
                            <label htmlFor="username">Username:</label>
                            <input disabled={inGame} id="username" type="text" placeholder="Username" value={username} onChange={onUsernameChange} maxLength="24"></input>
                        </div>
                        <fieldset className="flex flex-col my-4 min-w-0 h-full">
                        {creatingGame && (
                            <>
                                <legend>Game Settings</legend>
                                <label htmlFor="game-name">Game Name:</label>
                                <input id="game-name" type="text" placeholder="Game Name" value={gameName} onChange={(e) => setGameName(e.target.value)} maxLength="24"></input>
                                <HoldButton className="btn btn-default w-full mt-4 p-1" onComplete={createGame} text="Start Game"/>
                            </>
                        )}
                        {!creatingGame && !inGame && (
                            <GameBrowser games={games} />
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
                                    <button className="btn btn-primary-invert">Ready Up</button>
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