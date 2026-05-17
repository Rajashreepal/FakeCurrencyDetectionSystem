from __future__ import annotations
from dataclasses import dataclass, asdict
from io import BytesIO
from PIL import Image, ImageOps
import numpy as np
import cv2

@dataclass
class ImageQuality:
    width: int
    height: int
    aspect_ratio: float
    brightness: float
    contrast: float
    sharpness: float
    edge_density: float
    colorfulness: float
    quality_score: float
    warnings: list[str]

@dataclass
class FallbackSignals:
    quality: ImageQuality
    texture_score: float
    print_complexity_score: float
    geometry_score: float
    lighting_score: float
    fallback_risk: float
    notes: list[str]


def load_pil(image_bytes: bytes) -> Image.Image:
    im = Image.open(BytesIO(image_bytes))
    im = ImageOps.exif_transpose(im).convert("RGB")
    return im


def pil_to_cv(im: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)


def _clamp01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def analyze_quality(image_bytes: bytes) -> ImageQuality:
    im = load_pil(image_bytes)
    w, h = im.size
    arr = pil_to_cv(im)
    gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    edges = cv2.Canny(gray, 70, 180)
    edge_density = float(np.mean(edges > 0))
    # Hasler/Susstrunk colorfulness approximation
    rgb = cv2.cvtColor(arr, cv2.COLOR_BGR2RGB).astype(np.float32)
    rg = np.abs(rgb[:,:,0] - rgb[:,:,1])
    yb = np.abs(0.5*(rgb[:,:,0] + rgb[:,:,1]) - rgb[:,:,2])
    colorfulness = float(np.sqrt(np.std(rg)**2 + np.std(yb)**2) + 0.3*np.sqrt(np.mean(rg)**2 + np.mean(yb)**2))
    aspect = float(max(w,h) / max(1,min(w,h)))
    warnings=[]
    blur_score = _clamp01(sharpness / 650.0)
    contrast_score = _clamp01(contrast / 65.0)
    brightness_score = 1.0 - _clamp01(abs(brightness - 128.0) / 128.0)
    edge_score = 1.0 - abs(_clamp01(edge_density / 0.18) - 0.55) * 0.7
    aspect_score = 1.0 - min(1.0, abs(aspect - 2.2) / 1.8)
    if sharpness < 90: warnings.append("Image looks blurry; retake with steady camera and better focus.")
    if brightness < 55: warnings.append("Image is too dark; move to brighter light.")
    if brightness > 215: warnings.append("Image is overexposed; avoid flash glare.")
    if contrast < 25: warnings.append("Image has low contrast; security patterns may not be visible.")
    if w < 450 or h < 220: warnings.append("Image resolution is low; use a closer, clearer photo.")
    q = 0.30*blur_score + 0.20*contrast_score + 0.20*brightness_score + 0.15*edge_score + 0.15*aspect_score
    return ImageQuality(w,h,round(aspect,4),round(brightness,3),round(contrast,3),round(sharpness,3),round(edge_density,5),round(colorfulness,3),round(_clamp01(q),4),warnings)


def fallback_authenticity_signals(image_bytes: bytes, currency: str = "OTHER") -> FallbackSignals:
    q = analyze_quality(image_bytes)
    im = load_pil(image_bytes)
    arr = pil_to_cv(im)
    gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (384, 192), interpolation=cv2.INTER_AREA)
    # texture using local std over small image
    mean = cv2.blur(small.astype(np.float32), (9,9))
    sqmean = cv2.blur((small.astype(np.float32)**2), (9,9))
    local_std = np.sqrt(np.maximum(sqmean - mean**2, 0))
    texture = _clamp01(float(np.mean(local_std)) / 38.0)
    # print complexity: edge density and keypoint count
    edges = cv2.Canny(small, 60, 160)
    ed = float(np.mean(edges > 0))
    try:
        orb = cv2.ORB_create(nfeatures=750)
        kps = orb.detect(small, None)
        kp_score = _clamp01(len(kps) / 420.0)
    except Exception:
        kp_score = _clamp01(ed / 0.16)
    complexity = _clamp01(0.55*_clamp01(ed/0.16) + 0.45*kp_score)
    aspect_target = 2.1 if currency in {"USD","EUR","GBP"} else 2.25
    geometry = 1.0 - min(1.0, abs(q.aspect_ratio - aspect_target) / 1.4)
    lighting = 1.0 - _clamp01(abs(q.brightness - 128.0) / 118.0)
    authenticity_evidence = 0.30*q.quality_score + 0.25*texture + 0.25*complexity + 0.10*geometry + 0.10*lighting
    risk = 1.0 - authenticity_evidence
    notes = []
    if complexity < 0.35: notes.append("Low visible print-pattern complexity; inspect micro-printing and fine line details manually.")
    if texture < 0.35: notes.append("Low texture variation; image may be plain/printed/blurred rather than detailed banknote surface.")
    if geometry < 0.45: notes.append("Banknote shape/aspect looks unusual; crop the full note flat on a table.")
    if q.quality_score < 0.55: notes.append("Image quality is limiting the confidence of this analysis.")
    return FallbackSignals(q,round(texture,4),round(complexity,4),round(geometry,4),round(lighting,4),round(_clamp01(risk),4),notes)


def to_preprocessed_tensor(image_bytes: bytes, img_size: int = 224):
    # Returns numpy NCHW float32 normalized in ImageNet convention.
    im = load_pil(image_bytes).resize((img_size, img_size), Image.BILINEAR)
    arr = np.asarray(im).astype('float32') / 255.0
    mean = np.array([0.485,0.456,0.406], dtype='float32')
    std = np.array([0.229,0.224,0.225], dtype='float32')
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2,0,1))[None, ...]
    return arr.astype('float32')
