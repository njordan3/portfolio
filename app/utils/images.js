const cache = new Map();

export function use(promise) {
    if (promise.status === 'fulfilled') {
        return promise.value;
    } else if (promise.status === 'rejected') {
        throw promise.reason;
    } else if (promise.status === 'pending') {
        throw promise;
    } else {
        promise.status = 'pending';
        promise.then(
            result => {
                promise.status = 'fulfilled';
                promise.value = result;
            },
            reason => {
                promise.status = 'rejected';
                promise.reason = reason;
            },      
        );
        throw promise;
    }
}

export function getImage(source) {
    if (!cache.has(source)) {
        cache.set(source, loadImage(source));
    }

    return cache.get(source);
}

async function loadImage(source) {
    return new Promise(async (resolve) => {
        if (typeof document === 'undefined') {
            return resolve();
        }
        
        const img = new Image();
        img.src = source;
        img.onload = () =>  {
            return resolve(img);
        };
    });
}
