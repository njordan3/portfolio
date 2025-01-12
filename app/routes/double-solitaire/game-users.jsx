import { memo, useEffect, useMemo, useState } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

export default memo(function GameUsers() {
    const [userId, setUserId] = useState(null);
    const [owner, setOwner] = useState();
    const [opponent, setOpponent] = useState();
    const [spectators, setSpectators] = useState({});

    useEffect(() => {
        const game = MultiplayerGame.getInstance();
        setOwner(game.owner);
        setOpponent(game.opponent);
        setSpectators(game.spectators);
        setUserId(game.userId);

        MultiplayerGame.on('player-joined', (data) => setOpponent(data));
        MultiplayerGame.on('player-left', () => setOpponent(undefined));

        MultiplayerGame.on('user-joined', (data) => {
            setSpectators((prevSpectators) => {
                return { ...prevSpectators, [data.id]: data };
            });
        });
        MultiplayerGame.on('user-left', (data) => {
            setSpectators((prevSpectators) => {
                const spectators = structuredClone(prevSpectators);
                delete spectators[data.id];
                return spectators;
            });
        });

        MultiplayerGame.on('opponent-update', (data) => {
            setOpponent((prevOpponent) => {
                return {
                    ...prevOpponent,
                    ...data,
                };
            });
        });
        MultiplayerGame.on('owner-update', (data) => {
            setOwner((prevOwner) => {
                return {
                    ...prevOwner,
                    ...data,
                };
            });
        });
    }, []);

    const ReadyIcon = useMemo(() => (
        <span title="Ready to Play">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[var(--global-line-height)] text-[var(--success-color)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        </span>
    ), []);

    const DoneIcon = useMemo(() => (
        <span title="Can't Play Anymore">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[var(--global-line-height)] text-[var(--error-color)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        </span>
    ), []);

    const VoteRestartIcon = useMemo(() => (
        <span title="Wants to Play Again">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[var(--global-line-height)] text-[var(--primary-color)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
            </svg>
        </span>
    ), []);
    
    return (
        <>
            <legend>Game Users</legend>
            {owner && (
                <div className="flex flex-row justify-between">
                    <p
                        className={`${owner.connected ? '' : 'text-[var(--secondary-color)]'} my-1 truncate`}
                        title={`Game Owner: ${owner.name}`}
                    >
                        {owner.id === userId && '*'}{owner.name}
                    </p>
                    <div className="flex flex-row">
                        {owner.ready && ReadyIcon}
                        {owner.done && DoneIcon}
                        {owner.voteRestart && VoteRestartIcon}
                    </div>
                </div>
            )}
            {opponent && (
                <div className="flex flex-row justify-between">
                    <p
                        className={`${opponent.connected ? '' : 'text-[var(--secondary-color)]'} my-1 truncate`}
                        title={`Game Opponent: ${opponent.name}`}
                    >
                        {opponent.id === userId && '*'}{opponent.name}
                    </p>
                    <div className="flex flex-row">
                        {opponent.ready && ReadyIcon}
                        {opponent.done && DoneIcon}
                        {opponent.voteRestart && VoteRestartIcon}
                    </div>
                </div>
            )}
            <p className="my-4 text-xs text-[var(--secondary-color)]">[{Object.keys(spectators).length} Spectators]</p>
        </>
    );
});