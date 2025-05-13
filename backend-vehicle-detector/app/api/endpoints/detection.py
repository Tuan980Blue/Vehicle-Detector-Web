import os
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from ...services.detection_service import detection_service
from ...models.detection import DetectionResult, DetectionTask, DetectionStats
from ...core.config import settings

router = APIRouter()

@router.post("/image", response_model=DetectionResult)
async def process_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and process an image for vehicle detection
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )
    
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Process image
        result = detection_service.process_file(file_path)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        # Cleanup uploaded file
        background_tasks.add_task(os.remove, file_path)

@router.post("/video", response_model=DetectionResult)
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and process a video for vehicle detection
    """
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=400,
            detail="File must be a video"
        )
    
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Process video
        result = detection_service.process_file(file_path)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        # Cleanup uploaded file
        background_tasks.add_task(os.remove, file_path)

@router.get("/status/{task_id}", response_model=DetectionTask)
async def get_task_status(task_id: str):
    """
    Get the status of a detection task
    """
    task = detection_service.get_task_status(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return task

@router.get("/result/{task_id}", response_model=DetectionResult)
async def get_task_result(task_id: str):
    """
    Get the result of a completed detection task
    """
    task = detection_service.get_task_status(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    if task.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Task is not completed (status: {task.status})"
        )
    return task.result

@router.get("/download/{filename}")
async def download_processed_file(filename: str):
    """
    Download a processed image or video file
    """
    file_path = os.path.join(settings.OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=filename
    )

@router.get("/stats/{task_id}", response_model=DetectionStats)
async def get_detection_stats(task_id: str):
    """
    Get statistics for a completed detection task
    """
    task = detection_service.get_task_status(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    if task.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Task is not completed (status: {task.status})"
        )
    
    return detection_service.get_detection_stats(
        task.result.detections,
        task.result.processing_time
    ) 