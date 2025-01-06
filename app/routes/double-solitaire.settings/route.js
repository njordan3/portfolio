import { Ranks, Suits } from '../../../websocket/game/constants';
import { Dimensions, MultiplayerDimensions } from '../../../websocket/game/dimensions';

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
    });
}