export const randomId = () => crypto.randomUUID();

export const sanitizeString = (string) => {
    if (string && typeof string !== 'object') {
        string = String(string);
        string.trim();
        return string;
    }

    return '';
}

export function generateRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min+1)) + min;
}