/**
 * Product image upload utilities for ANNAPURNA Admin.
 *
 * Handles uploading admin-selected gallery images to Supabase Storage for
 * products, and safely cleaning up files that become orphaned (upload
 * succeeded but the product create/update failed, or an image was replaced).
 *
 * Storage bucket: `product-images` (public read, admin-only write — see
 * the SQL setup instructions provided alongside this feature).
 *
 * Files are stored at: products/{productId-or-uploadId}/{unique-file-name}.{ext}
 */

import { supabase } from '../lib/supabase';

export const PRODUCT_IMAGE_BUCKET = 'product-images';
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_HINT = 'JPG, PNG or WEBP • Max 5 MB';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_URL_PREFIX = `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

/**
 * Validate a File selected from the device gallery/file picker.
 * Rejects unsupported types and files over the size limit.
 */
export function validateProductImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type. Please upload a JPG, PNG, or WEBP image.' };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'Image exceeds the 5 MB limit. Please choose a smaller file.' };
  }
  return { valid: true, error: null };
}

/** Whether a given image URL points at our managed product-images bucket. */
export function isManagedProductImageUrl(url) {
  return typeof url === 'string' && url.startsWith(PUBLIC_URL_PREFIX);
}

/** Extract the storage object path from a public product-image URL (or null). */
export function getStoragePathFromUrl(url) {
  if (!isManagedProductImageUrl(url)) return null;
  return url.slice(PUBLIC_URL_PREFIX.length).split('?')[0];
}

function sanitizeExtension(filename = '') {
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || 'jpg';
}

function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Generate a temporary unique folder id to use when uploading an image for a
 * product that doesn't exist yet (Add Product flow, upload happens before
 * the product row is created).
 */
export function generateUploadFolderId() {
  return `tmp-${generateUniqueId()}`;
}

/**
 * Upload a validated image file to Supabase Storage.
 * `folderId` should be the product id (Edit) or a temporary unique id (Add).
 * Returns { publicUrl, path }. Throws on failure.
 */
export async function uploadProductImage(file, folderId) {
  const validation = validateProductImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileName = `${generateUniqueId()}.${sanitizeExtension(file.name)}`;
  const path = `products/${folderId}/${fileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('uploadProductImage error:', error);
    throw new Error('Unable to upload image. Please try again.');
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

/**
 * Upload multiple validated image files to Supabase Storage, preserving order.
 * `folderId` should be the product id (Edit) or a temporary unique id (Add).
 *
 * Uploads sequentially so a single failure can be attributed to the right
 * file, and any files uploaded before the failure are still returned so the
 * caller can decide whether to keep or roll them back.
 *
 * Returns { uploaded, error, failedIndex } where `uploaded` is the list of
 * { publicUrl, path } for files that succeeded, in the same order as input.
 */
export async function uploadProductImages(files, folderId) {
  const uploaded = [];
  for (let i = 0; i < files.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadProductImage(files[i], folderId);
      uploaded.push(result);
    } catch (err) {
      return { uploaded, error: err, failedIndex: i };
    }
  }
  return { uploaded, error: null, failedIndex: -1 };
}

/**
 * Best-effort delete of a storage object by its storage path.
 * Never throws — cleanup failures should not block the admin UI.
 */
export async function deleteProductImageByPath(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  if (error) {
    console.warn('deleteProductImageByPath: cleanup failed (non-fatal):', error.message);
  }
}

/**
 * Best-effort delete of a storage object by its public URL. Only deletes
 * files that live in our managed bucket — safe no-op for external URLs.
 */
export async function deleteProductImageByUrl(url) {
  const path = getStoragePathFromUrl(url);
  if (!path) return;
  await deleteProductImageByPath(path);
}
