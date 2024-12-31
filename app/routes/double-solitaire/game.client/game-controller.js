import { MultiplayerGame } from "./multiplayer-game";
import { SingleplayerGame } from "./singleplayer-game";

export function getGame() {
    const params = new URLSearchParams(document.location.search);
    const isMultiplayer = params.get('multiplayer') !== null;
    // console.log(MultiplayerGame.isServerConnected());
    if (isMultiplayer && false) {
        return MultiplayerGame.getInstance();
    }

    return SingleplayerGame.getInstance();
}