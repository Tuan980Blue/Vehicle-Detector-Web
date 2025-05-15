import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Chip,
    Stack,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Person as PersonIcon,
    DirectionsCar as CarIcon,
    TwoWheeler as MotorcycleIcon,
    LocalShipping as TruckIcon,
    DirectionsBus as BusIcon,
    Timer as TimerIcon,
    PedalBike as BicycleIcon,
} from '@mui/icons-material';
import { DetectionResult as DetectionResultType, DetectionStats, VehicleClass } from '../types/api';
import { getDownloadUrl } from '../api/client';

interface DetectionResultProps {
    result: DetectionResultType;
    stats?: DetectionStats;
    isLoading?: boolean;
}

// Map class names to colors (matching backend colors)
const classColors: Record<string, string> = {
    [VehicleClass.CAR]: '#00FF00',        // Green
    [VehicleClass.MOTORCYCLE]: '#FF0000', // Blue
    [VehicleClass.BUS]: '#0000FF',        // Red
    [VehicleClass.TRUCK]: '#FFFF00',      // Cyan
    [VehicleClass.BICYCLE]: '#FF00FF',    // Magenta
};

// Map class names to icons
const classIcons: Record<string, React.ReactElement> = {
    [VehicleClass.CAR]: React.createElement(CarIcon),
    [VehicleClass.MOTORCYCLE]: React.createElement(MotorcycleIcon),
    [VehicleClass.BUS]: React.createElement(BusIcon),
    [VehicleClass.TRUCK]: React.createElement(TruckIcon),
    [VehicleClass.BICYCLE]: React.createElement(BicycleIcon),
};

// Format class names for display
const formatClassName = (className: string): string => {
    return className.charAt(0).toUpperCase() + className.slice(1);
};

const DetectionResult: React.FunctionComponent<DetectionResultProps> = ({ result, stats, isLoading = false }) => {
    const isVideo = ['.mp4', '.avi', '.mov'].some(ext => 
        result.filename.toLowerCase().endsWith(ext)
    );
    const processedUrl = getDownloadUrl(result.processed_filename);

    // Group detections by class
    const detectionsByClass = result.detections.reduce((acc, det) => {
        acc[det.class_name] = (acc[det.class_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Grid container spacing={3}>
                    {/* Preview */}
                    <Grid item xs={12} md={8}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '56.25%', // 16:9 aspect ratio
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                overflow: 'hidden',
                            }}
                        >
                            {isLoading ? (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : isVideo ? (
                                <video
                                    src={processedUrl}
                                    controls
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : (
                                <img
                                    src={processedUrl}
                                    alt="Detection result"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            )}
                        </Box>
                    </Grid>

                    {/* Stats and Info */}
                    <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                            {/* Filter Info */}
                            {result.filter && result.filter.target_classes && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Detection Settings
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Vehicle Classes:
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {Array.from(result.filter.target_classes).map(cls => (
                                            <Chip
                                                key={cls}
                                                icon={classIcons[cls]}
                                                label={formatClassName(cls)}
                                                sx={{
                                                    bgcolor: classColors[cls],
                                                    color: 'white',
                                                    '& .MuiChip-icon': { color: 'white' }
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Min Confidence: {result.filter.min_confidence.toFixed(2)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Detection Stats */}
                            {stats && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Detection Statistics
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Vehicles: {stats.total_vehicles}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                                        {Object.entries(stats.by_class).map(([cls, count]) => (
                                            <Chip
                                                key={cls}
                                                icon={classIcons[cls]}
                                                label={`${formatClassName(cls)}: ${count}`}
                                                sx={{
                                                    bgcolor: classColors[cls],
                                                    color: 'white',
                                                    '& .MuiChip-icon': { color: 'white' }
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Processing Time: {stats.processing_time.toFixed(2)}s
                                    </Typography>
                                </Box>
                            )}

                            {/* File Info */}
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    File Information
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Original: {result.filename}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Processed: {result.processed_filename}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status: {result.status}
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export { DetectionResult }; 