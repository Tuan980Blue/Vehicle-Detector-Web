import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    Box,
    Button,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Slider,
    Paper,
    Divider,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { uploadImage, uploadVideo } from '../api/client';
import { DetectionResult, VehicleClass, VehicleFilter } from '../types/api';

interface FileUploadProps {
    onUploadComplete: (result: DetectionResult) => void;
    onError: (error: string) => void;
}

const FileUpload: React.FunctionComponent<FileUploadProps> = ({ onUploadComplete, onError }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState<VehicleClass[]>([
        VehicleClass.CAR,
        VehicleClass.MOTORCYCLE
    ]);
    const [minConfidence, setMinConfidence] = useState<number>(0.5);

    const handleClassChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as VehicleClass;
        setSelectedClasses(prev => {
            if (event.target.checked) {
                return [...prev, value];
            } else {
                return prev.filter(cls => cls !== value);
            }
        });
    };

    const handleConfidenceChange = (_: Event, newValue: number | number[]) => {
        setMinConfidence(newValue as number);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const filter: VehicleFilter = {
                target_classes: selectedClasses,
                min_confidence: minConfidence
            };

            const isVideo = ['.mp4', '.avi', '.mov'].some(ext => 
                file.name.toLowerCase().endsWith(ext)
            );
            const result = isVideo
                ? await uploadVideo(file, filter)
                : await uploadImage(file, filter);
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
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Detection Settings
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                    Vehicle Classes
                </Typography>
                <FormGroup row sx={{ justifyContent: 'center', mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedClasses.includes(VehicleClass.CAR)}
                                onChange={handleClassChange}
                                value={VehicleClass.CAR}
                            />
                        }
                        label="Car"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedClasses.includes(VehicleClass.MOTORCYCLE)}
                                onChange={handleClassChange}
                                value={VehicleClass.MOTORCYCLE}
                            />
                        }
                        label="Motorcycle"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedClasses.includes(VehicleClass.BUS)}
                                onChange={handleClassChange}
                                value={VehicleClass.BUS}
                            />
                        }
                        label="Bus"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedClasses.includes(VehicleClass.TRUCK)}
                                onChange={handleClassChange}
                                value={VehicleClass.TRUCK}
                            />
                        }
                        label="Truck"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedClasses.includes(VehicleClass.BICYCLE)}
                                onChange={handleClassChange}
                                value={VehicleClass.BICYCLE}
                            />
                        }
                        label="Bicycle"
                    />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Minimum Confidence: {minConfidence.toFixed(2)}
                </Typography>
                <Slider
                    value={minConfidence}
                    onChange={handleConfidenceChange}
                    min={0}
                    max={1}
                    step={0.05}
                    marks={[
                        { value: 0, label: '0' },
                        { value: 0.5, label: '0.5' },
                        { value: 1, label: '1' }
                    ]}
                    sx={{ maxWidth: 400, mx: 'auto' }}
                />
            </Paper>

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