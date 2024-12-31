import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export default function HoldButton(props) {
    const {
        holdTime = 1, // Seconds
        onComplete = () => {},
        text,
        className = '',
        resetOnComplete = false,
    } = props;

    const interval = useMemo(() => 10/holdTime, [holdTime]);
    const [holdProgress, setHoldProgress] = useState(0);
    const [complete, setComplete] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const progressTimerRef = useRef(null);
    const helpTimerRef = useRef(null);
    const handleMouseDown = useCallback(() => {
        // Hack to make a quick click show help text
        if (holdProgress <= 0) {
            setHoldProgress(1);
        }
        setShowHelp(false);
        clearTimeout(helpTimerRef.current);
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
            setHoldProgress((prevProgress) => {
                const newProgress = prevProgress + interval
                if (newProgress >= 100) {
                    clearInterval(progressTimerRef.current);
                    return 100;
                }
                return newProgress;
            });
        }, 100);
    }, [interval, holdProgress, setHoldProgress, onComplete, resetOnComplete]);

    const handleMouseUp = useCallback(() => {
        clearInterval(progressTimerRef.current);
        if (!complete) {
            if (holdProgress > 0) {
                setShowHelp(true);
                clearTimeout(helpTimerRef.current);
                helpTimerRef.current = setTimeout(() => {
                    setShowHelp(false);
                }, 5000);
            }

            progressTimerRef.current = setInterval(() => {
                setHoldProgress((prevProgress) => {
                    const newProgress = prevProgress - interval
                    if (newProgress <= 0) {
                        clearInterval(progressTimerRef.current);
                        return 0;
                    }
                    return newProgress;
                });
            }, 100);
        } else if (resetOnComplete) {
            setComplete(false);
        }
    }, [interval, holdProgress, setHoldProgress, onComplete, complete, resetOnComplete]);

    useEffect(() => {
        if (holdProgress >= 100) {
            setComplete(true);
            if (resetOnComplete) {
                setHoldProgress(0);
            }
            onComplete();
        }
    }, [holdProgress, resetOnComplete])

    useEffect(() => {
        return () => {
            clearInterval(progressTimerRef.current);
            clearTimeout(helpTimerRef.current);
        };
    }, []);
    
    return (
        <button
            className={className}
            title={`${text} (Hold)`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                className="absolute bottom-0 left-0 h-[5px] bg-[green]"
                style={{
                    width: `${holdProgress}%`,
                    transition: 'width 0.1s ease'
                }}
            />
            {text}
            {showHelp && !complete && (
                <p className="absolute top-0 right-0 text-xs">(Hold)</p>
            )}
        </button>
    );
};