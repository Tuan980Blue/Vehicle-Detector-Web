import os
import time
import uuid
from typing import List, Tuple, Dict, Optional, Set
from pathlib import Path
import cv2
import numpy as np
import torch.serialization
import torch.nn.modules.container
import torch.nn.modules.conv
import torch.nn.modules.batchnorm
import torch.nn.modules.activation
import torch.nn.modules.pooling
import torch.nn.modules.upsampling
import torch.nn.modules.dropout
import torch.nn.modules.linear
import torch.nn.modules.normalization
import torch.nn.modules.padding
import torch.nn.modules.flatten
import torch.nn
from ultralytics import YOLO
from ultralytics.nn.tasks import DetectionModel
from ultralytics.nn.modules.conv import Conv, Concat
from ultralytics.nn.modules.block import C2f, Bottleneck, BottleneckCSP, SPP, SPPF, DFL
from ultralytics.nn.modules.head import Detect
from ..core.config import settings
from ..models.detection import (
    DetectionResult, BoundingBox, DetectionTask, DetectionStats,
    VehicleClass, VehicleFilter
)

# Add required classes to safe globals
torch.serialization.add_safe_globals([
    DetectionModel,
    Conv,
    Concat,
    C2f,
    Bottleneck,
    BottleneckCSP,
    SPP,
    SPPF,
    DFL,
    Detect,
    torch.nn.modules.container.Sequential,
    torch.nn.modules.container.ModuleList,
    torch.nn.modules.container.ModuleDict,
    torch.nn.modules.conv.Conv2d,
    torch.nn.modules.conv.ConvTranspose2d,
    torch.nn.modules.batchnorm.BatchNorm2d,
    torch.nn.modules.activation.SiLU,
    torch.nn.modules.activation.ReLU,
    torch.nn.modules.activation.LeakyReLU,
    torch.nn.modules.activation.Hardswish,
    torch.nn.modules.pooling.MaxPool2d,
    torch.nn.modules.pooling.AdaptiveAvgPool2d,
    torch.nn.modules.pooling.AvgPool2d,
    torch.nn.modules.upsampling.Upsample,
    torch.nn.modules.dropout.Dropout,
    torch.nn.modules.dropout.Dropout2d,
    torch.nn.modules.linear.Linear,
    torch.nn.modules.normalization.LayerNorm,
    torch.nn.modules.normalization.GroupNorm,
    torch.nn.modules.padding.ZeroPad2d,
    torch.nn.modules.flatten.Flatten,
    torch.nn.AdaptiveMaxPool2d,
])

class DetectionService:
    def __init__(self):
        self.model = YOLO(settings.MODEL_PATH)
        self.tasks: Dict[str, DetectionTask] = {}
        self._class_mapping = {
            "car": VehicleClass.CAR,
            "motorcycle": VehicleClass.MOTORCYCLE,
            "bus": VehicleClass.BUS,
            "truck": VehicleClass.TRUCK,
            "bicycle": VehicleClass.BICYCLE
        }
        
    def _create_task(self, filename: str) -> DetectionTask:
        """Create a new detection task"""
        task_id = str(uuid.uuid4())
        task = DetectionTask(
            task_id=task_id,
            filename=filename,
            status="pending"
        )
        self.tasks[task_id] = task
        return task
    
    def _update_task_status(self, task_id: str, status: str, error: Optional[str] = None):
        """Update task status"""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = status
            task.updated_at = time.time()
            if error:
                task.error = error
    
    def _filter_detections(
        self,
        detections: List[BoundingBox],
        filter: Optional[VehicleFilter] = None
    ) -> List[BoundingBox]:
        """Filter detections based on vehicle class and confidence"""
        if not filter:
            filter = VehicleFilter()  # Use default filter
            
        filtered_detections = []
        for det in detections:
            # Convert class name to VehicleClass enum
            try:
                vehicle_class = self._class_mapping[det.class_name.lower()]
            except KeyError:
                continue  # Skip unknown classes
                
            # Apply filters
            if (filter.target_classes is None or vehicle_class in filter.target_classes) and \
               det.confidence >= filter.min_confidence:
                filtered_detections.append(det)
                
        return filtered_detections

    def _process_image(
        self,
        image_path: str,
        filter: Optional[VehicleFilter] = None
    ) -> Tuple[List[BoundingBox], str]:
        """Process a single image and return filtered detections and output path"""
        # Run inference
        results = self.model(
            image_path,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD
        )[0]
        
        # Process detections
        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            detections.append(BoundingBox(
                x1=float(x1),
                y1=float(y1),
                x2=float(x2),
                y2=float(y2),
                confidence=float(box.conf[0]),
                class_id=int(box.cls[0]),
                class_name=results.names[int(box.cls[0])]
            ))
        
        # Apply filters
        filtered_detections = self._filter_detections(detections, filter)
        
        # Draw filtered detections on image
        img = cv2.imread(image_path)
        for det in filtered_detections:
            # Use different colors for different vehicle classes
            color = {
                VehicleClass.CAR: (0, 255, 0),      # Green
                VehicleClass.MOTORCYCLE: (255, 0, 0), # Blue
                VehicleClass.BUS: (0, 0, 255),      # Red
                VehicleClass.TRUCK: (255, 255, 0),   # Cyan
                VehicleClass.BICYCLE: (255, 0, 255)  # Magenta
            }.get(self._class_mapping[det.class_name.lower()], (0, 255, 0))
            
            cv2.rectangle(
                img,
                (int(det.x1), int(det.y1)),
                (int(det.x2), int(det.y2)),
                color,
                2
            )
            cv2.putText(
                img,
                f"{det.class_name} {det.confidence:.2f}",
                (int(det.x1), int(det.y1) - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2
            )
        
        # Save processed image
        output_filename = f"processed_{Path(image_path).name}"
        output_path = os.path.join(settings.OUTPUT_DIR, output_filename)
        cv2.imwrite(output_path, img)
        
        return filtered_detections, output_filename
    
    def _process_video(
        self,
        video_path: str,
        filter: Optional[VehicleFilter] = None
    ) -> Tuple[List[BoundingBox], str]:
        """Process a video and return filtered detections and output path"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Create output video writer
        output_filename = f"processed_{Path(video_path).name}"
        output_path = os.path.join(settings.OUTPUT_DIR, output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        all_detections = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Run inference on frame
            results = self.model(
                frame,
                conf=settings.CONFIDENCE_THRESHOLD,
                iou=settings.IOU_THRESHOLD
            )[0]
            
            # Process detections
            frame_detections = []
            for box in results.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                det = BoundingBox(
                    x1=float(x1),
                    y1=float(y1),
                    x2=float(x2),
                    y2=float(y2),
                    confidence=float(box.conf[0]),
                    class_id=int(box.cls[0]),
                    class_name=results.names[int(box.cls[0])]
                )
                frame_detections.append(det)
            
            # Apply filters
            filtered_detections = self._filter_detections(frame_detections, filter)
            all_detections.extend(filtered_detections)
            
            # Draw filtered detections on frame
            for det in filtered_detections:
                # Use different colors for different vehicle classes
                color = {
                    VehicleClass.CAR: (0, 255, 0),      # Green
                    VehicleClass.MOTORCYCLE: (255, 0, 0), # Blue
                    VehicleClass.BUS: (0, 0, 255),      # Red
                    VehicleClass.TRUCK: (255, 255, 0),   # Cyan
                    VehicleClass.BICYCLE: (255, 0, 255)  # Magenta
                }.get(self._class_mapping[det.class_name.lower()], (0, 255, 0))
                
                cv2.rectangle(
                    frame,
                    (int(det.x1), int(det.y1)),
                    (int(det.x2), int(det.y2)),
                    color,
                    2
                )
                cv2.putText(
                    frame,
                    f"{det.class_name} {det.confidence:.2f}",
                    (int(det.x1), int(det.y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    color,
                    2
                )
            
            # Write processed frame
            out.write(frame)
            frame_count += 1
            
            # Update task progress
            if frame_count % 10 == 0:  # Update every 10 frames
                progress = (frame_count / total_frames) * 100
                self._update_task_status(
                    task_id,
                    f"processing ({progress:.1f}%)"
                )
        
        # Cleanup
        cap.release()
        out.release()
        
        return all_detections, output_filename
    
    def process_file(
        self,
        file_path: str,
        filter: Optional[VehicleFilter] = None
    ) -> DetectionResult:
        """Process an image or video file with optional filtering"""
        start_time = time.time()
        task = self._create_task(Path(file_path).name)
        task_id = task.task_id
        
        try:
            self._update_task_status(task_id, "processing")
            
            # Determine if file is image or video
            is_video = file_path.lower().endswith(('.mp4', '.avi', '.mov'))
            
            if is_video:
                detections, output_filename = self._process_video(file_path, filter)
            else:
                detections, output_filename = self._process_image(file_path, filter)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Create result
            result = DetectionResult(
                task_id=task_id,
                filename=Path(file_path).name,
                processed_filename=output_filename,
                detections=detections,
                processing_time=processing_time,
                status="completed",
                filter=filter
            )
            
            # Update task with result
            task.result = result
            self._update_task_status(task_id, "completed")
            
            return result
            
        except Exception as e:
            self._update_task_status(task_id, "failed", str(e))
            raise
    
    def get_task_status(self, task_id: str) -> Optional[DetectionTask]:
        """Get status of a detection task"""
        return self.tasks.get(task_id)
    
    def get_detection_stats(self, detections: List[BoundingBox], processing_time: float) -> DetectionStats:
        """Calculate statistics from detections"""
        by_class = {}
        for det in detections:
            by_class[det.class_name] = by_class.get(det.class_name, 0) + 1
        
        return DetectionStats(
            total_vehicles=len(detections),
            by_class=by_class,
            processing_time=processing_time
        )

# Create singleton instance
detection_service = DetectionService() 