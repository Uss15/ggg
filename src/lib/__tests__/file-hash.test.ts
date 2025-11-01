import { describe, it, expect } from 'vitest';
import { calculateFileHash } from '../file-hash';

describe('File Hash Utils', () => {
  it('generates consistent hash for same content', async () => {
    const file1 = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const file2 = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const hash1 = await calculateFileHash(file1);
    const hash2 = await calculateFileHash(file2);
    
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different content', async () => {
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' });
    
    const hash1 = await calculateFileHash(file1);
    const hash2 = await calculateFileHash(file2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('generates SHA-256 hash format', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const hash = await calculateFileHash(file);
    
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
