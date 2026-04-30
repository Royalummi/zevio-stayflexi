import React, { useState } from "react";
import { X, Plus, Image, Eye, Trash2, AlertCircle } from "lucide-react";
import "./ImageGalleryManager.css";

const ImageGalleryManager = ({ images = [], onChange, maxImages = 20 }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [error, setError] = useState("");

  // Handle adding new image
  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      setError("Please enter a valid image URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(newImageUrl);
    } catch (e) {
      setError("Please enter a valid URL");
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Check for duplicates
    if (images.includes(newImageUrl.trim())) {
      setError("This image URL already exists");
      return;
    }

    onChange([...images, newImageUrl.trim()]);
    setNewImageUrl("");
    setShowAddModal(false);
    setError("");
  };

  // Handle removing image
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle image load error
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
    e.target.classList.add("error-image");
  };

  return (
    <div className="image-gallery-manager">
      <div className="gallery-header">
        <div className="gallery-title">
          <Image className="icon" />
          <span>Property Images</span>
          <span className="image-count">
            ({images.length}/{maxImages})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={images.length >= maxImages}
          className="add-image-btn"
        >
          <Plus /> Add Image
        </button>
      </div>

      {images.length === 0 ? (
        <div className="empty-gallery">
          <Image className="empty-icon" />
          <p>No images added yet</p>
          <p className="empty-hint">Click "Add Image" to get started</p>
        </div>
      ) : (
        <div className="images-grid">
          {images.map((image, index) => (
            <div
              key={index}
              className={`image-item ${draggedIndex === index ? "dragging" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={image}
                alt={`Property ${index + 1}`}
                onError={handleImageError}
              />
              <div className="image-overlay">
                <button
                  type="button"
                  onClick={() => setPreviewImage(image)}
                  className="overlay-btn preview-btn"
                  title="Preview"
                >
                  <Eye />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="overlay-btn delete-btn"
                  title="Delete"
                >
                  <Trash2 />
                </button>
              </div>
              {index === 0 && <span className="primary-badge">Primary</span>}
              <span className="image-number">{index + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Image</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewImageUrl("");
                  setError("");
                }}
                className="close-btn"
              >
                <X />
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="error-message">
                  <AlertCircle />
                  <span>{error}</span>
                </div>
              )}
              <label>Image URL</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => {
                  setNewImageUrl(e.target.value);
                  setError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && handleAddImage()}
                placeholder="https://example.com/image.jpg"
                autoFocus
              />
              <div className="modal-hint">
                <AlertCircle size={14} />
                <span>Enter a valid image URL (jpg, png, webp)</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewImageUrl("");
                  setError("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddImage}
                className="btn-primary"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay preview-modal"
          onClick={() => setPreviewImage(null)}
        >
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="close-preview-btn"
            >
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryManager;
