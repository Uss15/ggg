/**
 * File integrity utilities for SHA-256 hashing
 */

export const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyFileHash = async (file: File, expectedHash: string): Promise<boolean> => {
  const actualHash = await calculateFileHash(file);
  return actualHash === expectedHash;
};
