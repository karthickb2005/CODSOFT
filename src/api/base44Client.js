import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for refresh token cookie
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        console.log(`[PHASE2_API] Request to: ${config.url}`);
        const token = localStorage.getItem('accessToken');
        if (token) {
            console.log("[AUTH_TOKEN] Token attached");
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response) {
            const requestId = error.response.headers['x-request-id'];
            if (requestId) {
                console.error(`[REQUEST_FAIL] RequestID: ${requestId}`, {
                    url: originalRequest?.url,
                    status: error.response.status
                });
            } else {
                console.error(`[REQUEST_FAIL]`, {
                    url: originalRequest?.url,
                    status: error.response.status
                });
            }
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const response = await api.post(`/auth/refresh`, {});
                // Backend: { success: true, data: { token: "..." } }
                const { token } = response.data?.data || response.data;
                localStorage.setItem('accessToken', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return api(originalRequest);
            } catch (err) {
                // Refresh failed - logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

const unwrap = (res) => res.data?.data ?? res.data;

const createEntityService = (endpoint) => ({
    list: async (orderBy = '', limit = 100) => {
        const response = await api.get(`/${endpoint}`, { params: { orderBy, limit } });
        return unwrap(response);
    },
    filter: async (filterObj = {}, orderBy = '', limit = 100) => {
        const response = await api.get(`/${endpoint}`, { params: { ...filterObj, orderBy, limit } });
        return unwrap(response);
    },
    create: async (data) => {
        const response = await api.post(`/${endpoint}`, data);
        return unwrap(response);
    },
    update: async (id, data) => {
        const response = await api.put(`/${endpoint}/${id}`, data);
        return unwrap(response);
    },
    delete: async (id) => {
        const response = await api.delete(`/${endpoint}/${id}`);
        return unwrap(response);
    },
});

const base44 = {
    auth: {
        me: async () => {
            const response = await api.get('/auth/me');
            const data = response.data?.data || response.data;
            // Map backend field names to frontend expected names if necessary
            return {
                id: data._id,
                full_name: data.name,
                email: data.email,
                role: data.role,
                avatar: 'https://github.com/shadcn.png' // Default avatar
            };
        }
    },
    entities: {
        Project: createEntityService('projects'),
        Task: createEntityService('tasks'),
        User: {
            ...createEntityService('users'),
            login: (data) => {
                console.log("AUTH CALL:", `/auth/login`);
                return api.post(`/auth/login`, data);
            },
            signup: (data) => api.post(`/users/register`, data),
            refresh: () => api.post(`/auth/refresh`, {})
        },
        TeamMember: createEntityService('team'),
        Workspace: {
            list: async () => [{ id: '1', name: 'Main Workspace', organization_id: '1' }]
        },
        AIAnalysis: {
            ...createEntityService('ai-insights'),
            dashboard: async () => {
                const response = await api.get('/ai-insights/dashboard');
                return response.data?.data || response.data;
            }
        },
        Activity: {
            feed: async (page = 1, limit = 20) => {
                const response = await api.get(`/activity?page=${page}&limit=${limit}`);
                return response.data?.data || response.data;
            }
        },
        ActivityLog: {
            list: async () => [
                { id: '1', action: 'created', entity_type: 'task', created_date: new Date().toISOString(), details: { description: 'Website Redesign' } }
            ]
        },
        Invite: {
            get: async (token) => {
                const response = await api.get(`/invite/${token}`);
                return response.data?.data || response.data;
            },
            accept: async (token) => {
                const response = await api.post('/invite/accept', { token });
                return response.data?.data || response.data;
            }
        }
    },
    integrations: {
        Core: {
            InvokeLLM: async (data) => {
                const response = await api.post('/ai-insights/invoke', data);
                return response.data?.data || response.data;
            }
        },
        Analytics: {
            summary: async () => {
                const response = await api.get('/analytics');
                return response.data?.data || response.data;
            }
        }
    }
};

export { api, base44 };
