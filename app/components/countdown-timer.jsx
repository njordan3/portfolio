import { useState, useEffect, memo, useMemo } from "react";

export default memo(function CountdownTimer({ initialSeconds = 0, className = '', text = 'Countdown:' }) {
  const [milliseconds, setMilliseconds] = useState(initialSeconds * 1000);
  const [show, setShow] = useState(true);

  useEffect(() => {
    let timer = setInterval(() => {
      if (milliseconds > 0) {
        setMilliseconds((prev) => prev - 10);
      } else {
        clearInterval(timer);
      }
    }, 10); // Update every 10ms for millisecond precision

    if (milliseconds === 0) {
      clearInterval(timer);
      timer = setInterval(() => {
        setShow((prev) => !prev);
      }, 500); // Blink at the end of countdown
    }

    return () => clearInterval(timer);
  }, [milliseconds]);

  const secondDisplay = useMemo(() => Math.floor(milliseconds/1000), [milliseconds]);
  const millisecondDisplay = useMemo(() => {
    return milliseconds - (secondDisplay * 1000);
  }, [milliseconds, secondDisplay]);

  return (
    <div className="mt-4">
      {text}
      <div className={`border border-font-color py-[0.7em] px-[0.5em] flex justify-center ${className}`}>
        <span className={`${show ? '' : 'invisible'} select-none`}>
          {milliseconds === 0 ? (
            <>0.000</>
          ) : (
            <>
              {secondDisplay}.
              {millisecondDisplay < 100 ? `0${millisecondDisplay}` : millisecondDisplay}
            </>
          )}
        </span>
      </div>
    </div>
  );
});