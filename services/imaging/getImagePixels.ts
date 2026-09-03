import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { toByteArray } from 'base64-js';
import { PixelBuffer } from './types';
import { EyeRegionBox } from './eyeDetection.types';

const MAX_DIMENSION = 200;

/**
 * Native (iOS/Android) implementation. There is no canvas API on native, so
 * real pixel data is obtained by: resizing the actual captured photo with
 * expo-image-manipulator (a real, on-device image operation), then decoding
 * the resulting JPEG bytes with jpeg-js (a pure-JS decoder, no native module
 * required — works inside Expo Go). This gives genuine per-pixel data on
 * native too, not a placeholder — the same downstream analysis functions
 * run against real pixels on both platforms. `cropRegion` is accepted for
 * API parity with the web implementation but is only ever populated on web
 * today (native eye detection isn't available — see eyeDetection.ts).
 */
export async function getImagePixels(uri: string, cropRegion?: EyeRegionBox): Promise<PixelBuffer> {
  const actions = cropRegion
    ? [
        {
          crop: {
            originX: Math.round(cropRegion.x),
            originY: Math.round(cropRegion.y),
            width: Math.round(cropRegion.width),
            height: Math.round(cropRegion.height),
          },
        },
        { resize: { width: MAX_DIMENSION } },
      ]
    : [{ resize: { width: MAX_DIMENSION } }];

  const result = await manipulateAsync(uri, actions, {
    base64: true,
    format: SaveFormat.JPEG,
    compress: 0.9,
  });

  if (!result.base64) {
    throw new Error('Image manipulation did not return base64 data');
  }

  const bytes = toByteArray(result.base64);
  const decoded = jpeg.decode(bytes, { useTArray: true });

  return {
    data: new Uint8Array(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength),
    width: decoded.width,
    height: decoded.height,
  };
}
