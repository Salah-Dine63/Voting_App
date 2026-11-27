const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
    .replace(/\/+$/, '');

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const responseText = await response.text();
    let data = {};
    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error('The server returned an invalid response.');
        }
    }

    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
};

export const getSocketUrl = () => (
    import.meta.env.VITE_SOCKET_URL ||
    API_URL.replace(/\/api$/, '')
);