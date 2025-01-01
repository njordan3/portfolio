import { memo, useEffect, useState } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

export default memo(function GameUsers() {
    const [owner, setOwner] = useState();
    const [opponent, setOpponent] = useState();
    const [spectators, setSpectators] = useState({});

    useEffect(() => {
        const game = MultiplayerGame.getInstance();
        setOwner(game.owner);
        setOpponent(game.opponent);
        setSpectators(game.spectators);

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
    
    return (
        <>
            {owner && (
                <p>{owner.name} {owner.connected && '(connected)'} {owner.ready && '(ready)'} {owner.done && '(done)'}</p>
            )}
            {opponent && (
                <p>{opponent.name} {opponent.connected && '(connected)'} {opponent.ready && '(ready)'} {opponent.done && '(done)'}</p>
            )}
        </>
    );
});