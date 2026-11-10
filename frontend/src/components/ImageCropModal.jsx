import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Check,
  X,
  Loader2
} from "lucide-react";
import "./ImageCropModal.css";

/**
 * Load image as HTMLImageElement
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
  };
}

/**
 * Crop image to HTML5 canvas and export as high-quality JPEG Blob
 */
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas export failed."));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Interactive Image Cropper Modal for Avatar & Cover photos
 */
export default function ImageCropModal({
  isOpen,
  imageSrc,
  title = "Crop & Adjust Image",
  cropShape = "round", // 'round' for avatar, 'rect' for cover
  aspect = 1, // 1:1 for avatar, 3:1 for cover banner
  onCancel,
  onSave
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isProcessing) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  const onCropComplete = useCallback((_croppedArea, pixelCrop) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        await onSave(croppedBlob);
      }
    } catch (err) {
      console.error("[Crop] Failed to process image crop:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="crop-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div className="crop-modal-backdrop" onClick={!isProcessing ? onCancel : undefined} />
      
      <div className="crop-modal-container">
        {/* Header */}
        <div className="crop-modal-header">
          <h3 id="crop-modal-title" className="crop-modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="crop-modal-close-btn"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Close cropper"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropper Viewport */}
        <div className="crop-modal-body">
          <div className="crop-viewport-wrapper">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="crop-modal-controls">
          <div className="crop-control-group zoom-group">
            <span className="control-label">Zoom</span>
            <div className="control-slider-row">
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                title="Zoom Out"
                disabled={isProcessing}
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="crop-range-slider"
                disabled={isProcessing}
                aria-label="Zoom level"
              />
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                title="Zoom In"
                disabled={isProcessing}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          <div className="crop-control-group rotate-group">
            <span className="control-label">Rotate</span>
            <div className="rotate-actions-row">
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                title="Rotate 90° Counter-Clockwise"
                disabled={isProcessing}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate 90° Clockwise"
                disabled={isProcessing}
              >
                <RotateCw size={16} />
              </button>
              <button
                type="button"
                className="crop-tool-btn reset-btn"
                onClick={handleReset}
                title="Reset adjustments"
                disabled={isProcessing}
              >
                <RefreshCw size={15} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="crop-modal-footer">
          <button
            type="button"
            className="crop-action-btn cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="crop-action-btn apply-btn"
            onClick={handleApplyCrop}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Apply & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
