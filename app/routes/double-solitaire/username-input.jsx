import { useCallback, useEffect, useState } from "react";
import { MultiplayerGame } from "./game.client/multiplayer-game";

export default function UsernameInput({ className = '', disabled = false }) {
    const [username, setUsername] = useState('');
    
    const onUsernameChange = useCallback((e) => {
        const { value } = e.target;
        setUsername(value);
        MultiplayerGame.getInstance().username = value;
    }, [setUsername]);

    useEffect(() => {
        const username = localStorage.getItem('username') ?? '';
        setUsername(username);
        MultiplayerGame.getInstance().username = username;
    }, []);

    return (
        <div className={className}>
            <label htmlFor="username">Username:</label>
            <input disabled={disabled} id="username" type="text" placeholder="Username" value={username} onChange={onUsernameChange} maxLength="24"></input>
        </div>
    );
}