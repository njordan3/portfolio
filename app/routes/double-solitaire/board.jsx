import { useRef, useEffect, useCallback } from 'react';

import felt from '@images/tabletopfelt.jpg';
import cardSpriteSheet from '@images/decksprite.png';
import BoardCamera from './board-camera';
import { getImage, use } from '@/utils/images';

const suits = [{suit: 'hearts', color: 'red'}, {suit: 'diamonds', color: 'red'}, {suit: 'clubs', color: 'black'}, {suit: 'spades', color: 'black'}];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

const camera = new BoardCamera();
const boardCoordinates = {
    x: 0,
    y: 0,
    width: 2000,
    height: 1000
};

/**
 * For position considerations we are considering the middle to be at 0,0
 */
export default function Board() {
    const background = useRef(null);
    const foreground = useRef(null);
    const container = useRef(null);
    const cards = useRef(null);

    const cardsImage = use(getImage(cardSpriteSheet));
    const boardTexture = use(getImage(felt));
    
    const mouse = useRef({
        x: 0,
        y: 0,
        oldX: 0,
        oldY: 0,
        button: false,
        dragging: false,
    });
    
    const animationFrameId = useRef(null);

    const renderBackground = useCallback(() => {
        const { background } = camera.contexts;

        background.fillStyle = background.createPattern(boardTexture, 'repeat');
        background.fillRect(boardCoordinates.x, boardCoordinates.y, boardCoordinates.width, boardCoordinates.height);

    }, []);

    const renderForeground = useCallback(() => {
        const { foreground } = camera.contexts;
        cards.current.forEach(({ x, y, hitbox, context }) => {
            foreground.drawImage(context.canvas, x, y);
            foreground.strokeStyle = 'red';
            foreground.stroke(hitbox);
        });
    }, []);

    const resizeCanvas = useCallback(() => {
        foreground.current.width = background.current.width = container.current.clientWidth;
        foreground.current.height = background.current.height = container.current.clientHeight;

        camera.forceUpdate();
    }, [container]);

    const render = useCallback(() => {
        if (camera.needsUpdate) {
            camera.reset(); // Clear canvases

            camera.apply(); // Set the 2D context transform to the view
            renderForeground();
            renderBackground();
        }
        
        animationFrameId.current = window.requestAnimationFrame(render);
    }, [renderForeground, renderBackground, container, foreground, background]);

    const handleScroll = useCallback((e) => {
        camera.scaleAt({ x: e.clientX, y: e.clientY }, e.deltaY);
    }, []);

    const handleMouse = useCallback((e) => {
        if (e.type === 'mousedown') {
            mouse.current.button = true;
        }
        if (e.type === 'mouseup' || e.type === 'mouseout') {
            mouse.current.button = false;
            mouse.current.dragging = null;
        }
    
        mouse.current.oldX = mouse.current.x;
        mouse.current.oldY = mouse.current.y;
        mouse.current.x = e.clientX - e.target.offsetLeft;
        mouse.current.y = e.clientY - e.target.offsetTop;
        if (mouse.current.button) {
            if (e.type === 'mousedown') {
                const { x, y } = camera.getBoardPosition(mouse.current.x, mouse.current.y);
                
                for (let i = 0; i < cards.current.length; i++) {
                    const { hitbox, context } = cards.current[i];
                    if ( context.isPointInPath(hitbox, x, y) ) {
                        mouse.current.dragging = i;
                        break;
                    }
                }
            } else if (e.type === 'mousemove') {
                if (mouse.current.dragging !== null) {
                    const card = cards.current[mouse.current.dragging];

                    const { x, y } = camera.getBoardPosition(mouse.current.x, mouse.current.y);
                    card.x = x;
                    card.y = y;

                    const hitbox = new Path2D();
                    hitbox.rect(x, y, card.context.canvas.width, card.context.canvas.height);
                    card.hitbox = hitbox;

                    cards.current[mouse.current.dragging] = card;

                    camera.forceUpdate();
                } else {
                    camera.pan({ x: mouse.current.x - mouse.current.oldX, y: mouse.current.y - mouse.current.oldY });
                }
            }

            // check x and y seperately so the window doesnt get stuck
            // if (checkWindowXCollision(bg_coords, translation)) {
            //     camera.current.x += moveStart.current.x - x;
            // }
            // if (checkWindowYCollision(bg_coords, translation)) {
            //     camera.current.y += moveStart.current.y - y;
            // }
        }
    }, []);

    useEffect(() => {
        const fCanvas = foreground.current;
        const bCanvas = background.current;
        if (!fCanvas || !bCanvas || !container.current) {
            return;
        }

        const cardWidth = cardsImage.width/13;
        const cardHeight = cardsImage.height/4;

        const _cards = [];
        for (let i = 0; i < 52; i++) {
            const canvas = new OffscreenCanvas(cardWidth, cardHeight);
            const context = canvas.getContext('2d', { alpha: false });

            const row = i % 13;
            const col = i % 4;

            context.drawImage(
                cardsImage,
                row * cardWidth, col * cardHeight,
                cardWidth, cardHeight,
                0, 0,
                cardWidth, cardHeight,
            );

            context.save();

            const hitbox = new Path2D();
            hitbox.rect(100, 100, cardWidth, cardHeight);

            _cards.push({ x: 100, y: 100, hitbox, context });
        }

        cards.current = _cards;

        camera.setContexts(fCanvas.getContext('2d'), bCanvas.getContext('2d'));     

        window.addEventListener('resize', resizeCanvas);
    
        animationFrameId.current = window.requestAnimationFrame(render);
        resizeCanvas();

        return () => {
            window.cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', resizeCanvas);
        }
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