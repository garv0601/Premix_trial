import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Star, Trash2, Link as LinkIcon, Plus } from 'lucide-react';
import { validateProductImageFile, ALLOWED_IMAGE_HINT } from '../../utils/productImageUpload';

/**
 * ProductGalleryEditor
 *
 * Fully controlled multi-image gallery editor shared by AddProductModal and
 * EditProductModal. Lets an admin:
 *   - Upload multiple images (device files) or add images by URL
 *   - Reorder which image is the "cover" (first/front image customers see)
 *   - Remove any image from the gallery
 *
 * The parent owns the list of gallery items and is responsible for actually
 * uploading any pending files (item.file) to Supabase Storage on submit —
 * this component only manages the in-memory list + previews, matching the
 * existing lazy-upload-on-submit pattern used elsewhere in these modals.
 *
 * Each item shape: { id, url, file }
 *   - url:  displayable image URL. For a freshly picked file this is an
 *           object URL (revoked automatically when the item is removed).
 *   - file: the raw File to upload on submit, or undefined for images that
 *           already have a real URL (existing DB image or manually typed URL).
 *
 * The FIRST item in `items` is always the "cover"/front image.
 */
export default function ProductGalleryEditor({ items, onChange, disabled = false }) {
  const fileInputRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [localError, setLocalError] = useState(null);

  const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file(s) later
    if (files.length === 0) return;

    const validItems = [];
    let firstError = null;

    files.forEach((file) => {
      const { valid, error } = validateProductImageFile(file);
      if (!valid) {
        if (!firstError) firstError = error;
        return;
      }
      validItems.push({
        id: generateId(),
        url: URL.createObjectURL(file),
        file,
      });
    });

    setLocalError(firstError);
    if (validItems.length > 0) {
      onChange([...items, ...validItems]);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    onChange([...items, { id: generateId(), url: trimmed, file: undefined }]);
    setUrlDraft('');
    setLocalError(null);
  };

  const handleRemove = (id) => {
    const target = items.find((item) => item.id === id);
    if (target?.file && target.url) {
      URL.revokeObjectURL(target.url);
    }
    onChange(items.filter((item) => item.id !== id));
  };

  const handleSetCover = (id) => {
    const index = items.findIndex((item) => item.id === id);
    if (index <= 0) return;
    const next = [...items];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  };

  return (
    <div className="pfm-field">
      <label className="pfm-label">Product Gallery</label>

      {items.length > 0 && (
        <div className="pfm-gallery-grid">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pfm-gallery-item ${index === 0 ? 'pfm-gallery-item--cover' : ''}`}
              >
                <img src={item.url} alt={`Gallery ${index + 1}`} className="pfm-gallery-item-img" />

                {index === 0 && (
                  <span className="pfm-gallery-cover-badge">
                    <Star size={11} fill="currentColor" /> Cover
                  </span>
                )}

                <div className="pfm-gallery-item-actions">
                  {index !== 0 && (
                    <button
                      type="button"
                      className="pfm-gallery-cover-btn"
                      onClick={() => handleSetCover(item.id)}
                      disabled={disabled}
                      title="Set as cover image"
                      aria-label="Set as cover image"
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="pfm-gallery-remove-btn"
                    onClick={() => handleRemove(item.id)}
                    disabled={disabled}
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <label className={`pfm-image-upload pfm-gallery-upload ${disabled ? 'pfm-gallery-upload--disabled' : ''}`} htmlFor="pfm-gallery-file-input">
        <ImagePlus size={20} />
        <span>{items.length > 0 ? 'Add More Images' : 'Upload Images'}</span>
        <p>{ALLOWED_IMAGE_HINT} • Select multiple</p>
      </label>
      <input
        ref={fileInputRef}
        id="pfm-gallery-file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      <div className="pfm-gallery-url-row">
        <LinkIcon size={14} className="pfm-gallery-url-icon" />
        <input
          className="pfm-input pfm-gallery-url-input"
          type="text"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          placeholder="Or paste an image URL"
          disabled={disabled}
        />
        <button
          type="button"
          className="pfm-gallery-url-add-btn"
          onClick={handleAddUrl}
          disabled={disabled || !urlDraft.trim()}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {localError && <span className="pfm-error-text">{localError}</span>}
      {items.length > 1 && (
        <p className="pfm-image-priority-note">
          The first image (marked "Cover") is shown as the product's main photo everywhere on the site. Click the star on any other image to make it the cover.
        </p>
      )}
    </div>
  );
}
