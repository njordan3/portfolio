import { useRef, useEffect, useCallback } from 'react';

import felt from '@images/tabletopfelt.jpg';
import cardSpriteSheet from '@images/decksprite.png';
import { getImage, use } from '@/utils/images';
import { useGame } from './game';

/**
 * For position considerations we are considering the middle to be at 0,0
 */
export default function Board() {
    const background = useRef(null);
    const foreground = useRef(null);
    const container = useRef(null);

    use(getImage(cardSpriteSheet));
    const boardTexture = use(getImage(felt));

    const { game } = useGame();
    
    const animationFrameId = useRef(null);

    const renderBackground = useCallback(() => {
        const { background } = game.camera.contexts;

        background.fillStyle = background.createPattern(boardTexture, 'repeat');
        background.fillRect(0, 0, game.dimensions.boardWidth, game.dimensions.boardHeight);

        const { cardWidth, cardHeight, cardMargin } = game.dimensions;
        const { tableau, foundations, hand } = game;

        background.strokeStyle = 'gold';
        for (let i = 0; i < tableau.length; i++) {
            background.strokeRect(tableau[i].position.x - cardMargin, tableau[i].position.y - cardMargin, cardWidth + (2*cardMargin), cardHeight + (2*cardMargin));
        }

        for (let i = 0; i < foundations.length; i++) {
            background.strokeRect(foundations[i].position.x - cardMargin, foundations[i].position.y - cardMargin, cardWidth + (2*cardMargin), cardHeight + (2*cardMargin));
        }

        background.strokeStyle = 'gold';
        background.strokeRect(hand.position.x - cardMargin, hand.position.y - cardMargin, cardWidth + (2*cardMargin), cardHeight + (2*cardMargin));

    }, []);

    const renderForeground = useCallback(() => {
        const { foreground } = game.camera.contexts;
        const { tableau, foundations, hand } = game;

        if (hand.top('down')) {
            foreground.drawImage(game.cardBackImage, hand.position.x, hand.position.y);
        }
        
        let draggingCard = null;
        for (let i = 0; i < tableau.length; i++) {
            if (tableau[i].down.length > 0) {
                foreground.drawImage(game.cardBackImage, tableau[i].position.x, tableau[i].position.y);
            }

            for (let j = 0; j < tableau[i].up.length; j++) {
                const { position, context, isDragging } = tableau[i].up[j];
                if (isDragging) {
                    draggingCard = tableau[i].up[j];
                    continue;
                }

                foreground.drawImage(context.canvas, position.x, position.y);
            }
        }

        for (let i = 0; i < foundations.length; i++) {
            const topCard = foundations[i].top('up');

            if (topCard) {
                const { position, context } = topCard;
                foreground.drawImage(context.canvas, position.x, position.y);
            }
        }

        if (draggingCard !== null) {
            const { position, context, isDragging } = draggingCard;
            foreground.drawImage(context.canvas, position.x, position.y);
        }
    }, []);

    const resizeCanvas = useCallback(() => {
        foreground.current.width = background.current.width = container.current.clientWidth;
        foreground.current.height = background.current.height = container.current.clientHeight;

        game.camera.forceUpdate();
    }, [container]);

    const render = useCallback(() => {
        if (game.camera.needsUpdate) {
            game.camera.reset(); // Clear canvases

            game.camera.apply(); // Set the 2D context transform to the view
            renderBackground();
            renderForeground();
        }
        
        animationFrameId.current = window.requestAnimationFrame(render);
    }, [renderForeground, renderBackground, container, foreground, background]);

    useEffect(() => {
        const fCanvas = foreground.current;
        const bCanvas = background.current;
        if (!fCanvas || !bCanvas || !container.current) {
            return;
        }

        game.deal();

        game.camera.setContexts(fCanvas.getContext('2d'), bCanvas.getContext('2d'));     

        window.addEventListener('resize', resizeCanvas);
    
        animationFrameId.current = window.requestAnimationFrame(render);
        resizeCanvas();

        return () => {
            window.cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    const handleMouse = useCallback((e) => {
        game.mouseEvent(e)
    }, []);

    const handleScroll = useCallback((e) => {
        game.scrollEvent(e)
    }, []);

    console.log('render');
    return (
        <div id='board' className='flex' ref={container}>
            <canvas className='absolute z-[1] bg-black' ref={background} />
            <canvas
                className='absolute z-[2] bg-transparent'
                ref={foreground}
                onMouseMove={handleMouse}
                onMouseDown={handleMouse}
                onMouseUp={handleMouse}
                onMouseOut={handleMouse}
                onWheel={handleScroll}
            />
        </div>
    )
}