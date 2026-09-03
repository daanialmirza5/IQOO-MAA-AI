import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { EyeDetectionResult, EyeRegionBox } from './eyeDetection.types';

// Standard MediaPipe FaceMesh eye-contour landmark indices (478-point
// topology). Publicly documented indices, not something we invented.
const LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];

const MEDIAPIPE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

// MediaPipe's published bundle (both its ESM and CJS builds) contains a
// fully dynamic `import(expr)` call internally for its own WASM loading,
// which Metro's static bundler cannot resolve and fails production builds
// on — this is true regardless of how *this* file imports the package.
// The fix is to never let Metro see a static import/require of the package
// at all: load it directly from CDN via a runtime-constructed dynamic
// import, invisible to Metro's AST analysis (the standard bundler-bypass
// technique — equivalent to webpack's `/* webpackIgnore: true */`). The
// `import type` above is compile-time-only and erased by TypeScript, so it
// never reaches Metro either — it exists purely for type-checking.
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<typeof import('@mediapipe/tasks-vision')>;

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await dynamicImport(MEDIAPIPE_CDN_URL);
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      return FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = uri;
  });
}

/**
 * Real face/eye landmark detection (Google MediaPipe FaceLandmarker, running
 * fully in-browser via WASM — no server round-trip). Finds the eye region in
 * the actual captured photo and returns a bounding box biased slightly
 * downward toward the lower eyelid, since the model detects the visible eye
 * contour, not the pulled-down conjunctiva itself (that's not a standard
 * facial landmark — this narrows the crop to the right area, it doesn't
 * claim pixel-perfect conjunctiva segmentation).
 */
export async function detectEyeRegion(imageUri: string): Promise<EyeDetectionResult> {
  // Loading the model (WASM + a several-MB asset from Google's CDN) is
  // where a connectivity problem would actually surface. A failure here
  // means detection is genuinely unavailable right now — NOT that the
  // photo has no eye in it — so it must be reported differently from a
  // real "zero faces found" result, or a worker with no signal would be
  // wrongly told to keep retaking a perfectly good photo.
  let landmarker: FaceLandmarker;
  try {
    landmarker = await getLandmarker();
  } catch (e) {
    console.warn('Eye detection model failed to load (likely offline) — falling back to whole-frame sampling:', e);
    return { isAvailable: false, found: false };
  }

  try {
    const img = await loadImage(imageUri);
    const result = landmarker.detect(img);

    const face = result.faceLandmarks?.[0];
    if (!face) {
      return { isAvailable: true, found: false };
    }

    const indices = [...LEFT_EYE_INDICES, ...RIGHT_EYE_INDICES];
    const points = indices.map((i) => face[i]).filter(Boolean);
    if (points.length === 0) {
      return { isAvailable: true, found: false };
    }

    const xs = points.map((p) => p.x * img.width);
    const ys = points.map((p) => p.y * img.height);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Pad generously and bias downward toward the lower eyelid/conjunctiva.
    const padX = (maxX - minX) * 0.6;
    const padTop = (maxY - minY) * 0.4;
    const padBottom = (maxY - minY) * 1.4;

    const region: EyeRegionBox = {
      x: Math.max(0, minX - padX),
      y: Math.max(0, minY - padTop),
      width: Math.min(img.width, maxX + padX) - Math.max(0, minX - padX),
      height: Math.min(img.height, maxY + padBottom) - Math.max(0, minY - padTop),
    };

    return { isAvailable: true, found: true, region };
  } catch (e) {
    // The model loaded fine but something about processing this specific
    // image failed (e.g. a corrupt blob URL) — treat as "unavailable for
    // this attempt" rather than a confident "no eye found" verdict.
    console.warn('Eye detection failed on this image — falling back to whole-frame sampling:', e);
    return { isAvailable: false, found: false };
  }
}
