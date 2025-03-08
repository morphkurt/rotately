import { findVideoTkhdOffset, modifyTkhdMatrix, calculateMatrixOffset } from '../mp4_tkhd';
import fs from 'fs';
import path from 'path';

describe('MP4 TKHD operations', () => {

  describe('findVideoTkhdOffset', () => {
    let videoBuffer: Buffer;
    let audioBuffer: Buffer;
    let emptyBuffer: Buffer;
    let corruptedBuffer: Buffer;

    beforeAll(() => {
      videoBuffer = fs.readFileSync(path.join(__dirname, 'sample_video.mp4'));
      audioBuffer = fs.readFileSync(path.join(__dirname, 'sample_audio.mp4'));
      emptyBuffer = Buffer.alloc(0);
      corruptedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
    });

    it('should return correct tkhd offset for a valid MP4 with a video track', () => {
      const result = findVideoTkhdOffset(videoBuffer);
      expect(result).not.toBeNull();
      expect(result).toStrictEqual([198, 92]);
    });

    it('should return null for an MP4 without a video track', () => {
      const result = findVideoTkhdOffset(audioBuffer);
      expect(result).toBeNull();
    });

    it('should return null for an invalid or empty file', () => {
      const result = findVideoTkhdOffset(emptyBuffer);
      expect(result).toBeNull();
    });

    it('should return null for a corrupted MP4 file', () => {
      const result = findVideoTkhdOffset(corruptedBuffer);
      expect(result).toBeNull();
    });
  });
  describe('modifyTkhdMatrix', () => {
    let mockBuffer: Uint8Array;
    const matrixOffset = 10;

    beforeEach(() => {
      // Create a mock buffer with enough space for the matrix (36 bytes) plus offset
      mockBuffer = new Uint8Array(matrixOffset + 36 + 10).fill(0);
    });

    test('should not modify buffer if matrixOffset is out of bounds', () => {
      const outOfBoundsOffset = mockBuffer.length;
      const originalBuffer = new Uint8Array(mockBuffer);

      modifyTkhdMatrix(mockBuffer, outOfBoundsOffset);

      expect(mockBuffer).toEqual(originalBuffer);
    });

    test('should set 90cw rotation matrix values correctly', () => {
      modifyTkhdMatrix(mockBuffer, matrixOffset, '90cw');

      // Check first row (0, 1, 0)
      expect(mockBuffer[matrixOffset + 8]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 9]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 10]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 11]).toBe(0x00);

      expect(mockBuffer[matrixOffset + 12]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 13]).toBe(0x01);
      expect(mockBuffer[matrixOffset + 14]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 15]).toBe(0x00);

      expect(mockBuffer[matrixOffset + 16]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 17]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 18]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 19]).toBe(0x00);

      // Check second row (-1, 0, 0)
      expect(mockBuffer[matrixOffset + 20]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 21]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 22]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 23]).toBe(0x00);

      expect(mockBuffer[matrixOffset + 24]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 25]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 26]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 27]).toBe(0x00);

      // Check third row values
      expect(mockBuffer[matrixOffset + 40]).toBe(0x40);
      expect(mockBuffer[matrixOffset + 41]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 42]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 43]).toBe(0x00);
    });

    test('should set 90ccw rotation matrix values correctly', () => {
      modifyTkhdMatrix(mockBuffer, matrixOffset, '90ccw');

      // Check first row (0, -1, 0)
      expect(mockBuffer[matrixOffset + 8]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 9]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 10]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 11]).toBe(0x00);

      expect(mockBuffer[matrixOffset + 12]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 13]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 14]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 15]).toBe(0x00);

      // Check second row (1, 0, 0)
      expect(mockBuffer[matrixOffset + 20]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 21]).toBe(0x01);
      expect(mockBuffer[matrixOffset + 22]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 23]).toBe(0x00);
    });

    test('should set 180 rotation matrix values correctly', () => {
      modifyTkhdMatrix(mockBuffer, matrixOffset, '180');

      // Check first row (-1, 0, 0)
      expect(mockBuffer[matrixOffset + 8]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 9]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 10]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 11]).toBe(0x00);

      // Check second row (0, -1, 0)
      expect(mockBuffer[matrixOffset + 20]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 21]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 22]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 23]).toBe(0x00);

      expect(mockBuffer[matrixOffset + 24]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 25]).toBe(0xFF);
      expect(mockBuffer[matrixOffset + 26]).toBe(0x00);
      expect(mockBuffer[matrixOffset + 27]).toBe(0x00);
    });

    test('defaults to 90cw rotation when no rotation parameter provided', () => {
      // Create a buffer with known values
      const testBuffer = new Uint8Array(matrixOffset + 36 + 10).fill(0xFF);

      // Apply the default rotation
      modifyTkhdMatrix(testBuffer, matrixOffset);

      // Create another buffer and explicitly set 90cw
      const expectedBuffer = new Uint8Array(matrixOffset + 36 + 10).fill(0xFF);
      modifyTkhdMatrix(expectedBuffer, matrixOffset, '90cw');

      // Compare the results
      for (let i = 0; i < testBuffer.length; i++) {
        expect(testBuffer[i]).toBe(expectedBuffer[i]);
      }
    });

    test('maintains bytes outside matrix area', () => {
      // Fill buffer with known pattern
      for (let i = 0; i < mockBuffer.length; i++) {
        mockBuffer[i] = i % 256;
      }

      const originalBuffer = new Uint8Array(mockBuffer);
      modifyTkhdMatrix(mockBuffer, matrixOffset, '90cw');

      // Check bytes before matrix are unchanged
      for (let i = 0; i < matrixOffset + 8; i++) {
        expect(mockBuffer[i]).toBe(originalBuffer[i]);
      }

      // Check bytes after matrix are unchanged
      for (let i = matrixOffset + 44; i < mockBuffer.length; i++) {
        expect(mockBuffer[i]).toBe(originalBuffer[i]);
      }
    });
  });


  describe('calculateMatrixOffset', () => {
    let mockBufferV0: Uint8Array;
    let mockBufferV1: Uint8Array;
    const tkhdOffset = 20; // Arbitrary offset for testing

    beforeEach(() => {
      // Create mock buffers with enough space
      mockBufferV0 = new Uint8Array(tkhdOffset + 100);
      mockBufferV1 = new Uint8Array(tkhdOffset + 100);

      // Set version bytes
      mockBufferV0[tkhdOffset + 8] = 0; // Version 0
      mockBufferV1[tkhdOffset + 8] = 1; // Version 1
    });

    test('should calculate correct offset for version 0 tkhd box', () => {
      const offset = calculateMatrixOffset(mockBufferV0, tkhdOffset);

      // Expected calculation:
      // tkhdOffset + 4 (fullbox header) + 
      // 4 (creation_time) + 4 (modification_time) + 4 (track_ID) + 4 (reserved) + 4 (duration) +
      // 8 (reserved) + 2 (layer) + 2 (alternate_group) + 2 (volume) + 2 (reserved)
      const expectedOffset = tkhdOffset + 4 + 4 + 4 + 4 + 4 + 4 + 8 + 2 + 2 + 2 + 2;

      expect(offset).toBe(expectedOffset);
      expect(offset).toBe(tkhdOffset + 40); // Should be tkhdOffset + 40 for version 0
    });

    test('should calculate correct offset for version 1 tkhd box', () => {
      const offset = calculateMatrixOffset(mockBufferV1, tkhdOffset);

      // Expected calculation:
      // tkhdOffset + 4 (fullbox header) + 
      // 8 (creation_time) + 8 (modification_time) + 4 (track_ID) + 4 (reserved) + 8 (duration) +
      // 8 (reserved) + 2 (layer) + 2 (alternate_group) + 2 (volume) + 2 (reserved)
      const expectedOffset = tkhdOffset + 4 + 8 + 8 + 4 + 4 + 8 + 8 + 2 + 2 + 2 + 2;

      expect(offset).toBe(expectedOffset);
      expect(offset).toBe(tkhdOffset + 52); // Should be tkhdOffset + 52 for version 1
    });

    test('should handle different tkhdOffset values correctly', () => {
      const offsetValues = [0, 10, 100, 1000];

      offsetValues.forEach(baseOffset => {
        // Set up test buffers with different base offsets
        const testBufferV0 = new Uint8Array(baseOffset + 100);
        const testBufferV1 = new Uint8Array(baseOffset + 100);

        testBufferV0[baseOffset + 8] = 0;
        testBufferV1[baseOffset + 8] = 1;

        // Calculate and verify offsets
        const v0Offset = calculateMatrixOffset(testBufferV0, baseOffset);
        const v1Offset = calculateMatrixOffset(testBufferV1, baseOffset);

        expect(v0Offset).toBe(baseOffset + 40);
        expect(v1Offset).toBe(baseOffset + 52);
      });
    });

    test('should correctly handle buffer with minimum required size', () => {
      // Create buffers with just enough space to read the version
      const minBufferV0 = new Uint8Array(tkhdOffset + 9); // tkhdOffset + 8 + 1 for version byte
      const minBufferV1 = new Uint8Array(tkhdOffset + 9);

      minBufferV0[tkhdOffset + 8] = 0;
      minBufferV1[tkhdOffset + 8] = 1;

      // The function should calculate offsets without accessing out-of-bounds memory
      const v0Offset = calculateMatrixOffset(minBufferV0, tkhdOffset);
      const v1Offset = calculateMatrixOffset(minBufferV1, tkhdOffset);

      expect(v0Offset).toBe(tkhdOffset + 40);
      expect(v1Offset).toBe(tkhdOffset + 52);
    });

    test('should handle unknown or custom version values', () => {
      // Create buffer with non-standard version
      const customVersionBuffer = new Uint8Array(tkhdOffset + 100);
      customVersionBuffer[tkhdOffset + 8] = 2; // Non-standard version

      // The function should default to version 0 behavior or handle it specifically
      // Note: This test may need adjustment based on how you want to handle unknown versions
      const offset = calculateMatrixOffset(customVersionBuffer, tkhdOffset);

      // Since the implementation treats any non-1 version as version 0
      expect(offset).toBe(tkhdOffset + 40);
    });

    test('should handle edge case with very large tkhdOffset', () => {
      const largeOffset = Number.MAX_SAFE_INTEGER - 100;
      const largeBuffer = new Uint8Array(10); // We don't need a real buffer this large

      // We'll use function implementation logic to calculate expected result
      const expectedV0Offset = largeOffset + 40;
      const expectedV1Offset = largeOffset + 52;

      // Mock the buffer access for version check
      // This approach avoids creating an unreasonably large buffer
      const calculateWithMock = (version: number) => {
        return calculateMatrixOffset({
          [largeOffset + 8]: version,
          length: Number.MAX_SAFE_INTEGER
        } as unknown as Uint8Array, largeOffset);
      };

      expect(calculateWithMock(0)).toBe(expectedV0Offset);
      expect(calculateWithMock(1)).toBe(expectedV1Offset);
    });
  });
});