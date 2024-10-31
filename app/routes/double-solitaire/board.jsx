import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

import { getImage, loadImage } from '@components/suspense-image'
import felt from '@images/tabletopfelt.jpg';
import cardSpriteSheet from '@images/decksprite.png';

const suits = [{suit: 'hearts', color: 'red'}, {suit: 'diamonds', color: 'red'}, {suit: 'clubs', color: 'black'}, {suit: 'spades', color: 'black'}];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

/**
 * For position considerations we are considering the middle to be at 0,0
 */
export default function Board() {
    const background = useRef(null);
    const foreground = useRef(null);
    const container = useRef(null);

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
    
    // useRefs so we don't re-render the component
    const camera = useRef(null);
    const moveStart = useRef(null);
    const isDragging = useRef(false);
    const backgroundCoords = useRef(null);

    const renderBackground = useCallback(() => {
        const canvas = background.current;
        const context = canvas.getContext('2d', { alpha: false });

        // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.save();
        const { x, y, zoom } = camera.current;
        context.translate(-x * zoom, -y * zoom);
        context.scale(zoom, zoom);
        context.rect(backgroundCoords.current.x, backgroundCoords.current.y, backgroundCoords.current.width, backgroundCoords.current.height);
        context.fillStyle = context.createPattern(getImage(felt).read().image, 'repeat');
        context.fill();
        context.restore();
    }, [background, backgroundCoords, container, camera]);

    const renderForeground = useCallback(() => {
        const canvas = foreground.current;
        const context = canvas.getContext('2d');

        // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        const { x, y, zoom } = camera.current;
        context.translate(-x * zoom, -y * zoom);
        context.scale(zoom, zoom);
        // context.translate(camera.current.x, camera.current.y);
        const { cards } = getImage(cardSpriteSheet).read();
        cards.forEach((card) => {
            context.drawImage(card, 0, 0);
        });
        context.restore();
    }, [foreground]);

    const resizeCanvas = useCallback(() => {
        const fContext = foreground.current.getContext('2d');
        const fCanvas = fContext.canvas;
        const bContext = background.current.getContext('2d', { alpha: false });
        const bCanvas = bContext.canvas;

        // const { width, height } = canvas.getBoundingClientRect();
    
        // if (canvas.width !== width || canvas.height !== height) {
        //     const { devicePixelRatio: ratio = 1 } = window;
        //     const context = canvas.getContext('2d');
        //     canvas.width = width * ratio;
        //     canvas.height = height * ratio;
        //     context.scale(ratio, ratio);
        // }
        fCanvas.width = bCanvas.width = container.current.clientWidth;
        fCanvas.height = bCanvas.height = container.current.clientHeight;
        // camera.current.x = camera.current.x || bCanvas.width/2 - MIDDLE.x;
        // camera.current.y = camera.current.y || bCanvas.height/2 - MIDDLE.y;
        
        renderBackground();
        // renderBoxes();
    }, [background, foreground]);

    const handleMouseMove = useCallback((e) => {
        const x = container.current.clientWidth/2 - camera.current.x + e.clientX;
        const y = container.current.clientHeight/2 - camera.current.y + e.clientY;
        if (isDragging.current) {
            // sendInput('mousemove', x, y);
        } else if (moveStart.current) {
            camera.current.x -= moveStart.current.x - x;
            camera.current.y -= moveStart.current.y - y;
            // check x and y seperately so the window doesnt get stuck
            // if (checkWindowXCollision(bg_coords, translation)) {
            //     camera.current.x += moveStart.current.x - x;
            // }
            // if (checkWindowYCollision(bg_coords, translation)) {
            //     camera.current.y += moveStart.current.y - y;
            // }
            resizeCanvas();
        }
    }, [isDragging, camera, resizeCanvas]);

    const handleMouseDown = useCallback((e) => {
        const x = container.current.clientWidth/2 - camera.current.x + e.clientX;
        const y = container.current.clientHeight/2 - camera.current.y + e.clientY;
        // if (checkCollision(x, y)) {
        //     isDragging.current = true;
        //     sendInput('mousedown', x, y);
        // } else {
        moveStart.current = {x, y};
        // }
    }, [camera, container]);

    const handleMouseUp = useCallback((e) => {
        if (isDragging.current) {
            // sendInput('mouseup', -translation.x + e.clientX, -translation.y + e.clientY)
        } else if (moveStart.current) {
            moveStart.current = null
        }
    }, [isDragging, moveStart]);

    const handleScroll = useCallback((e) => {
        const step = 0.5, min = 0.5, max = 3;
        const newZoom = camera.current.zoom + (e.nativeEvent.wheelDelta > 0 ? step : -step);
        if (newZoom <= max && newZoom >= min) {
            camera.current.zoom = newZoom;
            resizeCanvas();
        }
    }, [camera]);

    useEffect(() => {
        const fCanvas = foreground.current;
        const bCanvas = background.current;
        if (!fCanvas || !bCanvas || !container.current) {
            return;
        }

        const backgroundImage = getImage(felt).read().image;

        // How many background images fit in the canvas in the x and y directions
        const bgFitX = Math.ceil(container.current.clientWidth / backgroundImage.width);
        const bgFitY = Math.ceil(container.current.clientHeight / backgroundImage.height);

        backgroundCoords.current = {
            x: -backgroundImage.width * (bgFitX / 2),
            y: -backgroundImage.height * (bgFitY / 2),
            width: bgFitX * backgroundImage.width,
            height: bgFitY * backgroundImage.height
        };

        camera.current = {
            x: -container.current.clientWidth/2,
            y: -container.current.clientHeight/2,
            zoom: 1,
        };

        let animationFrameId;

        const render = () => {
            renderForeground();
            animationFrameId = window.requestAnimationFrame(render);
        }
        render();
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    console.log('render');
    return (
        <div id='board' className='flex' ref={container}>
            <canvas className='absolute z-[1]' ref={background} />
            <canvas
                className='absolute z-[2] bg-transparent'
                ref={foreground}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleScroll}
            />
        </div>
    )
}