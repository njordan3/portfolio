import HoldButton from "@/components/hold-button";
import { useCallback, useState } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

export default function GameSettings() {
    const [gameName, setGameName] = useState('');

    const createGame = useCallback(() => {
        MultiplayerGame.getInstance().createGame(gameName);
    }, [gameName]);
    
    return (
        <>
            <legend>Game Settings</legend>
            <label htmlFor="game-name">Game Name:</label>
            <input id="game-name" type="text" placeholder="Game Name" value={gameName} onChange={(e) => setGameName(e.target.value)} maxLength="24"></input>
            <HoldButton className="btn btn-default w-full mt-4 p-1" onComplete={createGame} text="Start Game"/>
        </>
    );
}