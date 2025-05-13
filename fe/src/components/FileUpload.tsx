import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { uploadImage, uploadVideo } from '../api/client';
import { DetectionResult } from '../types/api';

interface FileUploadProps {
    onUploadComplete: (result: DetectionResult) => void;
    onError: (error: string) => void;
}

const FileUpload: React.FunctionComponent<FileUploadProps> = ({ onUploadComplete, onError }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const isVideo = ['.mp4', '.avi', '.mov'].some(ext => 
                file.name.toLowerCase().endsWith(ext)
            );
            const result = isVideo
                ? await uploadVideo(file)
                : await uploadImage(file);
            onUploadComplete(result);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            // Reset input value to allow uploading the same file again
            event.target.value = '';
        }
    };

    return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
            <input
                accept="image/*,video/mp4,video/avi,video/quicktime"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            <label htmlFor="file-upload">
                <Button
                    variant="contained"
                    component="span"
                    startIcon={React.createElement(UploadIcon)}
                    disabled={isUploading}
                >
                    <>{isUploading ? 'Uploading...' : 'Upload File'}</>
                </Button>
            </label>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 1 }}>
                <>Supported formats: Images (JPEG, PNG) and Videos (MP4, AVI, MOV)</>
            </Typography>
        </Box>
    );
};

export { FileUpload }; 