import { findVideoTkhdOffset, modifyTkhdMatrix, calculateMatrixOffset, IDENTITY_MATRIX, ROTATE_180, ROTATE_270, ROTATE_90 } from '../mp4_tkhd';
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

  function createFileBuffer(size: number): Uint8Array {
    return new Uint8Array(size);
  }

  describe("modifyTkhdMatrix", () => {
    let identyMatrixBuffer: Uint8Array;
    let rotate90MatrixBuffer: Uint8Array;
    let rotate180MatrixBuffer: Uint8Array;
    let rotate270MatrixBuffer: Uint8Array;

    const matrixOffset = 100;

    beforeEach(() => {
      identyMatrixBuffer = createFileBuffer(200);
      rotate90MatrixBuffer = createFileBuffer(200);
      rotate180MatrixBuffer = createFileBuffer(200);
      rotate270MatrixBuffer = createFileBuffer(200);
      identyMatrixBuffer.set(IDENTITY_MATRIX,100);
      rotate90MatrixBuffer.set(ROTATE_90,100);
      rotate180MatrixBuffer.set(ROTATE_180,100);
      rotate270MatrixBuffer.set(ROTATE_270,100);
    });

    test("should modify file buffer for 90cw rotation", () => {
      modifyTkhdMatrix(identyMatrixBuffer, matrixOffset, IDENTITY_MATRIX,"90cw");
      expect(identyMatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_90);
      
      modifyTkhdMatrix(rotate90MatrixBuffer, matrixOffset, ROTATE_90, "90cw");
      expect(rotate90MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_180);

      modifyTkhdMatrix(rotate180MatrixBuffer, matrixOffset,ROTATE_180, "90cw");
      expect(rotate180MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_270);

      modifyTkhdMatrix(rotate270MatrixBuffer, matrixOffset,ROTATE_270, "90cw");
      expect(rotate270MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(IDENTITY_MATRIX);
    });

    test("should modify file buffer for 90ccw rotation", () => {
      modifyTkhdMatrix(identyMatrixBuffer, matrixOffset, IDENTITY_MATRIX,"90ccw");
      expect(identyMatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_270);
      
      modifyTkhdMatrix(rotate90MatrixBuffer, matrixOffset, ROTATE_90, "90ccw");
      expect(rotate90MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(IDENTITY_MATRIX);

      modifyTkhdMatrix(rotate180MatrixBuffer, matrixOffset,ROTATE_180, "90ccw");
      expect(rotate180MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_90);

      modifyTkhdMatrix(rotate270MatrixBuffer, matrixOffset,ROTATE_270, "90ccw");
      expect(rotate270MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_180);
    });

    test("should modify file buffer for 180 rotation", () => {
      modifyTkhdMatrix(identyMatrixBuffer, matrixOffset, IDENTITY_MATRIX,"180");
      expect(identyMatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_180);
      
      modifyTkhdMatrix(rotate90MatrixBuffer, matrixOffset, ROTATE_90, "180");
      expect(rotate90MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_270);

      modifyTkhdMatrix(rotate180MatrixBuffer, matrixOffset,ROTATE_180, "180");
      expect(rotate180MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(IDENTITY_MATRIX);

      modifyTkhdMatrix(rotate270MatrixBuffer, matrixOffset,ROTATE_270, "180");
      expect(rotate270MatrixBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(ROTATE_90);
    });
  });

  describe("calculateMatrixOffset", () => {
    it("should return correct matrix offset for version 0", () => {
      const fileBuffer = new Uint8Array(100);
      const tkhdOffset = 20;
      fileBuffer[tkhdOffset + 8] = 0; // Version 0

      const expectedOffset = tkhdOffset + 12 + (4 + 4 + 4 + 4 + 4) + 8 + 2 + 2 + 2 + 2;
      expect(calculateMatrixOffset(fileBuffer, tkhdOffset)).toBe(expectedOffset);
    });

    it("should return correct matrix offset for version 1", () => {
      const fileBuffer = new Uint8Array(100);
      const tkhdOffset = 20;
      fileBuffer[tkhdOffset + 8] = 1; // Version 1

      const expectedOffset = tkhdOffset + 12 + (8 + 8 + 4 + 4 + 8) + 8 + 2 + 2 + 2 + 2;
      expect(calculateMatrixOffset(fileBuffer, tkhdOffset)).toBe(expectedOffset);
    });
  });
});
