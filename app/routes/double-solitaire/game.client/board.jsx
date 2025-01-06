import { useRef, useEffect, useCallback, memo } from 'react';
import { use } from '@/utils/images';
import { GameController } from './game-controller';
import { Game, Mouse, Camera } from './internal';
import { SingleplayerGame } from './singleplayer-game';
import { useBeforeUnload } from '@remix-run/react';

/**
 * The board is a series of canvases and handles its own renders,
 * so we don't need react to re-render if the parent re-renders
 */
export default memo(Board);

function Board() {
    const background = useRef(null);
    const foreground = useRef(null);
    const container = useRef(null);

    use(Game.loadAssets());
    
    const animationFrameId = useRef(null);

    const renderBackground = useCallback(() => {
        GameController.getGame().renderBackground();
    }, []);

    const renderForeground = useCallback(() => {
        GameController.getGame().renderForeground();
    }, []);

    const resizeCanvas = useCallback(() => {
        foreground.current.width = background.current.width = container.current.clientWidth;
        foreground.current.height = background.current.height = container.current.clientHeight;
        Camera.getInstance().forceUpdate();
    }, []);

    const render = useCallback(() => {
        const camera = Camera.getInstance();

        if (camera.needsUpdate) {
            camera.reset(); // Clear canvases

            camera.apply(); // Set the 2D context transform to the view
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

        Mouse.getInstance();
        const camera = Camera.getInstance()
        camera.setContexts(fCanvas.getContext('2d'), bCanvas.getContext('2d'));
        const game = GameController.getGame();
        // Might need to consider rotation for multiplayer opponent camera
        const { startX, startY } = game.getDimensions();
        camera.position = {
            x: startX + (container.current.clientWidth/2),
            y: startY + (container.current.clientHeight/2),
        };

        new ResizeObserver(resizeCanvas).observe(container.current);
    
        animationFrameId.current = window.requestAnimationFrame(render);
        resizeCanvas();

        return () => {
            window.cancelAnimationFrame(animationFrameId.current);
            SingleplayerGame.getInstance().save();
        }
    }, []);

    useBeforeUnload(() => {
        SingleplayerGame.getInstance().save();
    }, []);

    const handleMouse = useCallback((e) => {
        const game = GameController.getGame();

        game.mouseEvent(e)
    }, []);

    const handleScroll = useCallback((e) => {
        const game = GameController.getGame();

        game.scrollEvent(e)
    }, []);

    console.log('board render');
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