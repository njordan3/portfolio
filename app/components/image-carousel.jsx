import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function ImageCarousel({ images }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const setIndex = useCallback((e, index) => {
        e.stopPropagation();

        if (index > images.length-1) {
            return setCurrentIndex(0);
        } else if (index < 0) {
            return setCurrentIndex(images.length-1);
        }
        return setCurrentIndex(index);
    }, [setCurrentIndex, images]);

    const image = useMemo(() => images[currentIndex] ?? false, [images, currentIndex]);

    const [enlargeImage, setEnlargeImage] = useState(false);
    const toggleEnlargeImage = useCallback(() => {
        setEnlargeImage(!enlargeImage);
    }, [enlargeImage, setEnlargeImage]);

    return image && (
        <div className="my-4">
            <figure key={crypto.randomUUID()}>
                <div className="flex justify-center items-center bg-[#39393e]">
                    <a onClick={(e) => setIndex(e, currentIndex-1)} disabled={images.length <= 0} className="text-2xl p-2 select-none">&#10094;</a>
                    <img src={image.src} alt={image.alt} className="h-80 block mx-auto cursor-pointer" onClick={toggleEnlargeImage}></img>
                    <a onClick={(e) => setIndex(e, currentIndex+1)} disabled={images.length <= 0} className="text-2xl p-2 right-0 select-none">&#10095;</a>
                </div>
                {image.caption && (
                    <figcaption>{image.caption}</figcaption>
                )}
            </figure>
            {enlargeImage && typeof document !== 'undefined' && createPortal(
                <div className="fixed top-0 left-0 w-screen h-screen bg-black/70 z-[500]" onClick={toggleEnlargeImage}>
                    <div className="fixed flex justify-center items-center w-full">
                        <div className="flex items-center bg-[#222225]/50">
                            <a onClick={(e) => setIndex(e, currentIndex-1)} disabled={images.length <= 0} className="text-2xl p-10 select-none">&#10094;</a>
                            <div className="relative">
                                <figure key={crypto.randomUUID()} className="bg-[#39393e]">
                                    <img src={image.src} alt={image.alt} className="w-[40rem]"></img>
                                    {image.caption && (
                                        <figcaption className="p-2">{image.caption}</figcaption>
                                    )}
                                </figure>
                            </div>
                            <a onClick={(e) => setIndex(e, currentIndex+1)} disabled={images.length <= 0} className="text-2xl p-10 select-none">&#10095;</a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}