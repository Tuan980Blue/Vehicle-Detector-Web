export interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
    class_id: number;
    class_name: string;
}

export interface DetectionResult {
    task_id: string;
    filename: string;
    processed_filename: string;
    detections: BoundingBox[];
    processing_time: number;
    created_at: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}

export interface DetectionStats {
    total_vehicles: number;
    by_class: Record<string, number>;
    processing_time: number;
}

export interface DetectionTask {
    task_id: string;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    result?: DetectionResult;
    error?: string;
}

export interface ApiError {
    detail: string;
    status_code: number;
} 