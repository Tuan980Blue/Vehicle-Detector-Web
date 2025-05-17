import React, { useState } from 'react';
import { Container, Typography, Alert, Box } from '@mui/material';
import { useQuery } from 'react-query';
import { FileUpload } from '../components/FileUpload';
import { DetectionResult as DetectionResultComponent } from '../components/DetectionResult';
import { DetectionResult, DetectionStats, DetectionTask } from '../types/api';
import {
    uploadImage,
    uploadVideo,
    getTaskStatus,
    getTaskResult,
    getDetectionStats,
} from '../api/client';
import { Image } from "@mui/icons-material";

export const Home = () => {
    const [currentResult, setCurrentResult] = useState<DetectionResult | null>(null);
    const [taskStatus, setTaskStatus] = useState<DetectionTask | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Query for task status
    const { data: taskStatusData } = useQuery(
        ['taskStatus', currentResult?.task_id],
        () => getTaskStatus(currentResult!.task_id),
        {
            enabled: !!currentResult?.task_id && currentResult.status === 'processing',
            refetchInterval: 1000,
            onSuccess: (task) => {
                setTaskStatus(task);
                if (task.status === 'completed' && task.result) {
                    setCurrentResult(task.result);
                } else if (task.status === 'failed') {
                    setError(task.error || 'Task failed');
                }
            },
            onError: (err: Error) => {
                setError(err.message);
            },
        }
    );

    // Query for task result
    const { data: taskResult } = useQuery(
        ['taskResult', currentResult?.task_id],
        () => getTaskResult(currentResult!.task_id),
        {
            enabled: !!taskStatus && taskStatus.status === 'completed',
            onSuccess: (result) => {
                setCurrentResult(result);
            },
            onError: (err: Error) => {
                setError(err.message);
            },
        }
    );

    // Query for detection stats
    const { data: stats } = useQuery(
        ['detectionStats', currentResult?.task_id],
        () => getDetectionStats(currentResult!.task_id),
        {
            enabled: !!taskResult,
        }
    );

    const handleUploadComplete = (result: DetectionResult) => {
        setCurrentResult(result);
        if (result.status === 'processing') {
            setTaskStatus({
                task_id: result.task_id,
                filename: result.filename,
                status: result.status,
                created_at: result.created_at,
                updated_at: new Date().toISOString(),
            });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <img src="/logo2.png" alt="Logo" style={{ height: '40px' }} />
                <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '-4px',
                            left: 0,
                            width: '100%',
                            height: '2px',
                            background: 'linear-gradient(90deg, #2196F3, #21CBF3)',
                            borderRadius: '2px',
                        }
                    }}
                >
                    Vehicle Detection
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
                Upload an image or video to detect vehicles using YOLOv8
            </Typography>

            <FileUpload
                onUploadComplete={handleUploadComplete}
                onError={setError}
            />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {currentResult && (
                <DetectionResultComponent
                    result={currentResult}
                    stats={stats}
                    isLoading={taskStatus?.status === 'processing'}
                />
            )}
        </Container>
    );
}; 