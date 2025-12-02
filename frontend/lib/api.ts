import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`; // Actually we need to pass it as a custom header or Bearer if backend expects it.
        // Backend expects 'token' header in some endpoints, or we can use Bearer.
        // Let's use a custom header 'token' as defined in main.py: token: str = Header(None)
        config.headers['token'] = session.accessToken;
    }
    return config;
});

export const fetchEmails = async () => {
    const response = await apiClient.get('/emails');
    return response.data;
};

export const classifyEmail = async (email: any) => {
    const response = await apiClient.post('/classify', email);
    return response.data;
};

export const generateReply = async (email: any) => {
    const response = await apiClient.post('/generate-reply', email);
    return response.data;
};

export const sendReply = async (email: any) => {
    const response = await apiClient.post('/send-reply', email);
    return response.data;
};
