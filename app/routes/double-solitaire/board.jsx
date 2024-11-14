import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

import { getImage, loadImage } from '@components/suspense-image'
import felt from '@images/tabletopfelt.jpg';
import cardSpriteSheet from '@images/decksprite.png';
import BoardCamera from './board-camera';

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
    
    const mouse = useRef({
        x: 0,
        y: 0,
        oldX: 0,
        oldY: 0,
        button: false,
    });

    loadImage(cardSpriteSheet, (image) => {
        // Cache card data on load
        const cardWidth = image.width/13;
        const cardHeight = image.height/4;

        const cards = [];
        for (let i = 0; i < 52; i++) {
            const canvas = new OffscreenCanvas(cardWidth, cardHeight);
            const context = canvas.getContext('2d', { alpha: false });

            const row = i % 13;
            const col = i % 4;

            context.drawImage(
                image,
                row * cardWidth, col * cardHeight,
                cardWidth, cardHeight,
                0, 0,
                cardWidth, cardHeight,
            );
            context.save();

            canvas.addEventListener('click', function(e) {

            })
            
            cards.push(canvas);
        }
        return {
            cards,
        };
    }).read();

    loadImage(felt).read();
    
    const animationFrameId = useRef(null);

    const renderBackground = useCallback(() => {
        const { background } = camera.contexts;

        background.fillStyle = background.createPattern(getImage(felt).read().image, 'repeat');
        background.fillRect(boardCoordinates.x, boardCoordinates.y, boardCoordinates.width, boardCoordinates.height);

    }, []);

    const renderForeground = useCallback(() => {
        const { foreground } = camera.contexts;
        const { cards } = getImage(cardSpriteSheet).read();
        cards.forEach((card) => {
            foreground.drawImage(card, boardCoordinates.width/2, boardCoordinates.height/2); // Temp draw in the middle of board
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
        }
    
        mouse.current.oldX = mouse.current.x;
        mouse.current.oldY = mouse.current.y;
        mouse.current.x = e.clientX - e.target.offsetLeft;
        mouse.current.y = e.clientY - e.target.offsetTop;
        if (mouse.current.button && e.type === 'mousemove') {
            camera.pan({ x: mouse.current.x - mouse.current.oldX, y: mouse.current.y - mouse.current.oldY });

            // check x and y seperately so the window doesnt get stuck
            // if (checkWindowXCollision(bg_coords, translation)) {
            //     camera.current.x += moveStart.current.x - x;
            // }
            // if (checkWindowYCollision(bg_coords, translation)) {
            //     camera.current.y += moveStart.current.y - y;
            // }
        }
        // console.log(camera.getBoardPosition(mouse.current.x, mouse.current.y));
    }, []);

    useEffect(() => {
        const fCanvas = foreground.current;
        const bCanvas = background.current;
        if (!fCanvas || !bCanvas || !container.current) {
            return;
        }

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