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

  function createFileBuffer(size: number): Uint8Array {
    return new Uint8Array(size);
  }

  describe("modifyTkhdMatrix", () => {
    let fileBuffer: Uint8Array;
    const matrixOffset = 100;

    beforeEach(() => {
      fileBuffer = createFileBuffer(200);
    });

    test("should modify file buffer for 90cw rotation", () => {
      modifyTkhdMatrix(fileBuffer, matrixOffset, "90cw");

      expect(fileBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(new Uint8Array([
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0xFF, 0xFF, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00
      ]));
    });

    test("should modify file buffer for 90ccw rotation", () => {
      modifyTkhdMatrix(fileBuffer, matrixOffset, "90ccw");

      expect(fileBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(new Uint8Array([
        0x00, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00
      ]));
    });

    test("should modify file buffer for 180 rotation", () => {
      modifyTkhdMatrix(fileBuffer, matrixOffset, "180");

      expect(fileBuffer.slice(matrixOffset, matrixOffset + 36)).toEqual(new Uint8Array([
        0xFF, 0xFF, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0x00, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,

        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x40, 0x00, 0x00, 0x00
      ]));
    });

    test("should not modify file buffer if offset is out of bounds", () => {
      modifyTkhdMatrix(fileBuffer, 180, "90cw");

      expect(fileBuffer).toEqual(createFileBuffer(200));
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
