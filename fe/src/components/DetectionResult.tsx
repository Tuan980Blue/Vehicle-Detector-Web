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
} from '@mui/material';
import {
    Download as DownloadIcon,
    Person as PersonIcon,
    DirectionsCar as CarIcon,
    TwoWheeler as MotorcycleIcon,
    LocalShipping as TruckIcon,
    DirectionsBus as BusIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';
import { DetectionResult as DetectionResultType, DetectionStats } from '../types/api';
import { getDownloadUrl } from '../api/client';

interface DetectionResultProps {
    result: DetectionResultType;
    stats?: DetectionStats;
    isLoading?: boolean;
}

// Map class names to icons
const classIcons: Record<string, React.ReactElement> = {
    person: React.createElement(PersonIcon),
    car: React.createElement(CarIcon),
    motorcycle: React.createElement(MotorcycleIcon),
    truck: React.createElement(TruckIcon),
    bus: React.createElement(BusIcon),
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

                    {/* Stats */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="h6" component="div" gutterBottom>
                                <>Detection Results</>
                            </Typography>
                            
                            {/* Processing Time */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TimerIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body1" component="div">
                                    <>Processing Time: {stats?.processing_time.toFixed(2)}s</>
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Detection Counts */}
                            <Typography variant="subtitle1" component="div" gutterBottom>
                                <>Objects Detected:</>
                            </Typography>
                            <List dense>
                                {Object.entries(detectionsByClass).map(([className, count]) => (
                                    <ListItem key={className}>
                                        <ListItemIcon>
                                            {classIcons[className] || React.createElement(CarIcon)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<>{`${formatClassName(className)}: ${count}`}</>}
                                            secondary={<>{`Confidence: ${Math.max(
                                                ...result.detections
                                                    .filter(d => d.class_name === className)
                                                    .map(d => d.confidence)
                                            ).toFixed(2)}`}</>}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            <Divider sx={{ my: 2 }} />

                            {/* Summary */}
                            <Typography variant="subtitle1" component="div" gutterBottom>
                                <>Summary:</>
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText
                                        primary={<>"Total Objects"</>}
                                        secondary={<>{result.detections.length}</>}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary={<>"Total Vehicles"</>}
                                        secondary={<>{result.detections.filter(
                                            d => d.class_name !== 'person'
                                        ).length}</>}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary={<>"Total People"</>}
                                        secondary={<>{result.detections.filter(
                                            d => d.class_name === 'person'
                                        ).length}</>}
                                    />
                                </ListItem>
                            </List>

                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    href={processedUrl}
                                    download
                                    fullWidth
                                >
                                    <>Download Result</>
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export { DetectionResult }; 