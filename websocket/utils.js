export const randomId = () => crypto.randomUUID();

export const sanitizeString = (string) => {
    if (string && typeof string !== 'object') {
        string = String(string);
        string.trim();
        return string;
    }

    return '';
}