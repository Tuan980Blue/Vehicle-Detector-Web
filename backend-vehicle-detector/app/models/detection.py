from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class BoundingBox(BaseModel):
    """Bounding box coordinates and confidence"""
    x1: float = Field(..., description="Top-left x coordinate")
    y1: float = Field(..., description="Top-left y coordinate")
    x2: float = Field(..., description="Bottom-right x coordinate")
    y2: float = Field(..., description="Bottom-right y coordinate")
    confidence: float = Field(..., description="Detection confidence score")
    class_id: int = Field(..., description="Class ID of detected object")
    class_name: str = Field(..., description="Class name of detected object")

class DetectionResult(BaseModel):
    """Result of vehicle detection"""
    task_id: str = Field(..., description="Unique task identifier")
    filename: str = Field(..., description="Original filename")
    processed_filename: str = Field(..., description="Filename of processed image/video")
    detections: List[BoundingBox] = Field(default_factory=list, description="List of detections")
    processing_time: float = Field(..., description="Processing time in seconds")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of creation")
    status: str = Field(..., description="Processing status: pending/processing/completed/failed")
    error: Optional[str] = Field(None, description="Error message if status is failed")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DetectionStats(BaseModel):
    """Statistics of detected vehicles"""
    total_vehicles: int = Field(..., description="Total number of vehicles detected")
    by_class: dict = Field(..., description="Count of vehicles by class")
    processing_time: float = Field(..., description="Total processing time in seconds")
    
    class Config:
        schema_extra = {
            "example": {
                "total_vehicles": 5,
                "by_class": {
                    "car": 3,
                    "motorcycle": 2
                },
                "processing_time": 1.23
            }
        }

class DetectionTask(BaseModel):
    """Task for vehicle detection"""
    task_id: str = Field(..., description="Unique task identifier")
    filename: str = Field(..., description="Original filename")
    status: str = Field(..., description="Task status: pending/processing/completed/failed")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of creation")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of last update")
    result: Optional[DetectionResult] = Field(None, description="Detection result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 