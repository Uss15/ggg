/**
 * Validation utilities for input data
 */

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export const validateCoordinates = (coords: GPSCoordinates): void => {
  const { latitude, longitude } = coords;
  
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }
  
  // Check for (0,0) which often indicates GPS failure
  if (latitude === 0 && longitude === 0) {
    throw new Error('Invalid coordinates: GPS may not be functioning');
  }
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'webm'];
  
  if (!ext || !allowedExts.includes(ext)) {
    return false;
  }
  
  return true;
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove special characters and spaces
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
};
