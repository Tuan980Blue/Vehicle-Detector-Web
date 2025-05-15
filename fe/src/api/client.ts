import axios, { AxiosError } from 'axios';
import { DetectionResult, DetectionTask, DetectionStats, ApiError, VehicleClass, VehicleFilter } from '../types/api';

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
export const uploadImage = async (
    file: File,
    filter?: VehicleFilter
): Promise<DetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add filter parameters if provided
    if (filter) {
        console.log('Filter before sending:', filter); // Debug log
        if (filter.target_classes && Array.isArray(filter.target_classes) && filter.target_classes.length > 0) {
            // Convert array to set of unique values and send as JSON string
            const uniqueClasses = Array.from(new Set(filter.target_classes));
            console.log('Unique classes to send:', uniqueClasses); // Debug log
            formData.append('target_classes', JSON.stringify(uniqueClasses));
        }
        if (filter.min_confidence !== undefined) {
            formData.append('min_confidence', filter.min_confidence.toString());
        }
    }
    
    // Debug log for FormData contents
    console.log('FormData contents:');
    Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(key, value);
    });
    
    try {
        const response = await client.post<DetectionResult>('/detection/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log('Response data:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Upload error:', error); // Debug log
        throw handleError(error as AxiosError);
    }
};

export const uploadVideo = async (
    file: File,
    filter?: VehicleFilter
): Promise<DetectionResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add filter parameters if provided
    if (filter) {
        if (filter.target_classes) {
            // Convert array to set of unique values
            const uniqueClasses = Array.from(new Set(filter.target_classes));
            uniqueClasses.forEach(cls => {
                formData.append('target_classes', cls);
            });
        }
        if (filter.min_confidence !== undefined) {
            formData.append('min_confidence', filter.min_confidence.toString());
        }
    }
    
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