import { useRef, useEffect, useCallback } from 'react';

import felt from '@images/tabletopfelt.jpg';
import cardSpriteSheet from '@images/decksprite.png';
import { getImage, use } from '@/utils/images';
import { useGame } from './game';
import Hand from './hand';

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

        for (let i = 0; i < game.tableau.length; i++) {
            game.tableau[i].renderBackground(background);
        }

        for (let i = 0; i < game.foundations.length; i++) {
            game.foundations[i].renderBackground(background);
        }

        game.hand.renderBackground(background);
    }, []);

    const renderForeground = useCallback(() => {
        const { foreground } = game.camera.contexts;
        const { tableau, foundations, hand } = game;

        if (hand.top('down')) {
            foreground.drawImage(game.cardBackImage, hand.position.x, hand.position.y);
        }

        const draggingCards = [];

        // Render only last 3 of hand up
        const indexClamp = (hand.up.length > Hand.dealAmount ? hand.up.length - Hand.dealAmount : 0);
        for (let i = indexClamp; i < hand.up.length; i++) {
            const { position, context, isDragging } = hand.up[i];
            if (isDragging) {
                draggingCards.push(hand.up[i]);
                continue;
            }

            foreground.drawImage(context.canvas, position.x, position.y);
        }
        
        for (let i = 0; i < tableau.length; i++) {
            if (tableau[i].down.length > 0) {
                foreground.drawImage(game.cardBackImage, tableau[i].position.x, tableau[i].position.y);
            }

            for (let j = 0; j < tableau[i].up.length; j++) {
                const { position, context, isDragging } = tableau[i].up[j];
                if (isDragging) {
                    draggingCards.push(tableau[i].up[j]);
                    continue;
                }

                foreground.drawImage(context.canvas, position.x, position.y);
            }
        }

        // Render only top cards
        for (let i = 0; i < foundations.length; i++) {
            const topCard = foundations[i].top('up');

            if (topCard) {
                const { position, context } = topCard;
                foreground.drawImage(context.canvas, position.x, position.y);
            }
        }

        // Render dragging cards last so they appear on top
        for (let i = 0; i < draggingCards.length; i++) {
            const { position, context } = draggingCards[i];
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