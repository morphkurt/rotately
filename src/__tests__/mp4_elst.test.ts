import {
  findElstAtoms,
  findAtom,
  findMvhdTimescales,
  readUint32,
  readInt32,
  readInt16,
  readUint64,
  readInt64
} from '../mp4_elst'; // Replace with actual file path
import fs from 'fs';
import path from 'path';


describe('MP4 Elst Parsing Tests', () => {
  let mockBuffer: Buffer;
      beforeAll(() => {
        mockBuffer = fs.readFileSync(path.join(__dirname, 'sample_video.mp4'));
      });
  

  test('findAtom - should find an atom by type', () => {
    const atom = findAtom(mockBuffer, 0, mockBuffer.length, 'moov');
    expect(atom).toBeTruthy();
    expect(atom?.type).toBe('moov');
  });


  test('findAtom - should find an atom by type', () => {
    const timescales = findMvhdTimescales(mockBuffer);
    expect(timescales[0]).toBe(30);
    expect(timescales[1]).toBe(48000);
  });


  test('findElstAtoms - should find and parse ELST atoms', () => {
    const elstAtoms = findElstAtoms(mockBuffer);
    expect(elstAtoms.length).toBeGreaterThan(0);
    let entry = elstAtoms[0].entries[0];
    expect(entry.segmentDuration).toEqual(18020);
    expect(entry.mediaTime).toEqual(0);
    expect(entry.mediaRateInteger).toEqual(1);
    expect(entry.mediaRateFraction).toEqual(0);

    entry = elstAtoms[1].entries[0];
    expect(entry.segmentDuration).toEqual(18316);
    expect(entry.mediaTime).toEqual(0);
    expect(entry.mediaRateInteger).toEqual(1);
    expect(entry.mediaRateFraction).toEqual(0);
  });

  test('readUint32 - should read 32-bit unsigned integer', () => {
    const value = readUint32(mockBuffer, 0);
    expect(value).toBeDefined();
    expect(value).toBeGreaterThan(0);
  });

  test('readInt32 - should read 32-bit signed integer', () => {
    const value = readInt32(mockBuffer, 0);
    expect(value).toBeDefined();
    expect(value).toBeGreaterThan(-100000000);
  });

  test('readInt16 - should read 16-bit signed integer', () => {
    const value = readInt16(mockBuffer, 0);
    expect(value).toBeDefined();
    expect(value).toBeGreaterThan(-1000);
  });

  test('readUint64 - should read 64-bit unsigned integer', () => {
    const value = readUint64(mockBuffer, 0);
    expect(value).toBeDefined();
    expect(value).toBeGreaterThan(0);
  });

  test('readInt64 - should read 64-bit signed integer', () => {
    const value = readInt64(mockBuffer, 0);
    expect(value).toBeDefined();
    expect(value).toBeGreaterThan(-1000000000000);
  });
});
