function createResource(asyncFn) {
    let status = 'pending';
    let result;

    const promise = asyncFn().then(
        async (r) => {
            // await new Promise(s => setTimeout(s, 2000));
            status = 'success';
            result = r;
        },
        (e) => {
            status = 'error';
            result = e;
        }
    );

    return {
        read() {
            switch (status) {
                case 'pending':
                    throw promise;
                case 'error':
                    throw result;
                case 'success':
                    return result;
            }
        },
    };
}

const cache = new Map();

export function loadImage(source, onloadFn = false) {
    const image = getImage(source);
    if (image) {
        return image;
    }

    const resource = createResource(() => {
        return new Promise((resolve, reject) => {
            // Server cannot load image so just resolve. We'll see if this causes hydration issues
            if (typeof document === 'undefined') {
                return resolve();
            }
            const img = new Image();
            img.src = source;
            img.onload = () =>  {
                let meta = {}
                if (onloadFn) {
                    meta = onloadFn(img);
                }
                return resolve({ image: img, ...meta });
            }
            img.onerror = () =>  reject(new Error(`Failed to load image ${source}`));
        });
    });

    cache.set(source, resource);
    return resource;
}

export function getImage(source) {
    return cache.get(source);
}

export function SuspenseImage(props) {
    loadImage(props.src).read();
    return <img {...props} />;
}
