import { useState } from 'react';
import { calculateFileHash } from '@/lib/file-hash';
import { toast } from 'sonner';

export const useFileHash = () => {
  const [isHashing, setIsHashing] = useState(false);

  const hashFile = async (file: File): Promise<string | null> => {
    setIsHashing(true);
    try {
      const hash = await calculateFileHash(file);
      return hash;
    } catch (error) {
      console.error('Error hashing file:', error);
      toast.error('Failed to calculate file hash');
      return null;
    } finally {
      setIsHashing(false);
    }
  };

  return { hashFile, isHashing };
};
