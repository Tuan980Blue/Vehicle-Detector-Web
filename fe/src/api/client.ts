import axios, { AxiosError } from 'axios';
import { DetectionResult, DetectionTask, DetectionStats, ApiError } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to handle API errors
const handleError = (error: AxiosError): ApiError => {
    if (error.response) {
        const responseData = error.response.data as { detail?: string };
        return {
            detail: responseData.detail || 'An error occurred',
            status_code: error.response.status,
        };
    }
    return {
        detail: error.message || 'Network error',
        status_code: 500,
    };
};

// API functions
export const uploadImage = async (file: File): Promise<DetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await client.post<DetectionResult>('/detection/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw handleError(error as AxiosError);
    }
};

export const uploadVideo = async (file: File): Promise<DetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await client.post<DetectionResult>('/detection/video', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw handleError(error as AxiosError);
    }
};

export const getTaskStatus = async (taskId: string): Promise<DetectionTask> => {
    try {
        const response = await client.get<DetectionTask>(`/detection/status/${taskId}`);
        return response.data;
    } catch (error) {
        throw handleError(error as AxiosError);
    }
};

export const getTaskResult = async (taskId: string): Promise<DetectionResult> => {
    try {
        const response = await client.get<DetectionResult>(`/detection/result/${taskId}`);
        return response.data;
    } catch (error) {
        throw handleError(error as AxiosError);
    }
};

export const getDetectionStats = async (taskId: string): Promise<DetectionStats> => {
    try {
        const response = await client.get<DetectionStats>(`/detection/stats/${taskId}`);
        return response.data;
    } catch (error) {
        throw handleError(error as AxiosError);
    }
};

export const getDownloadUrl = (filename: string): string => {
    return `${API_BASE_URL}/detection/download/${filename}`;
}; 