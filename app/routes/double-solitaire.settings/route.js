import { PlayerType, Ranks, Suits, Dimensions, MultiplayerDimensions } from '../../../websocket/game/internal.js';

export async function action({ request }) {
    if (request.method !== 'POST') {
        return Response.json({}, { status: 405});
    }

    return Response.json({
        dimensions: {
            multiplayer: MultiplayerDimensions.getInstance().toJSON(),
            singleplayer: Dimensions.getInstance().toJSON(),
        },
        ranks: Ranks,
        suits: Suits,
        playerTypes: PlayerType,
    });
}