from __future__ import annotations
from pathlib import Path
import json, time
import numpy as np
from app.core.config import settings
from app.services.image_features import to_preprocessed_tensor

class Softmax:
    @staticmethod
    def run(x: np.ndarray) -> np.ndarray:
        x = x.astype(np.float64)
        x = x - np.max(x, axis=1, keepdims=True)
        e = np.exp(x)
        return (e / np.sum(e, axis=1, keepdims=True)).astype(np.float32)

class TorchImageModel:
    def __init__(self, path: Path):
        self.path = path
        self.ready = False
        self.error = None
        self.classes = []
        self.model_name = None
        self.img_size = 224
        self.device_name = "cpu"
        self.model = None
        self._load()

    def _build_model(self, model_name: str, num_classes: int):
        import torch.nn as nn
        from torchvision import models
        if model_name == "efficientnet_b0":
            model = models.efficientnet_b0(weights=None)
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
            return model
        if model_name == "resnet18":
            model = models.resnet18(weights=None)
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            return model
        model = models.mobilenet_v3_large(weights=None)
        model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, num_classes)
        return model

    def _load(self):
        try:
            import torch
            ckpt = torch.load(self.path, map_location='cpu')
            self.classes = ckpt.get('classes', [])
            self.model_name = ckpt.get('model_name', 'mobilenet_v3_large')
            self.img_size = int(ckpt.get('img_size', 224))
            num_classes = int(ckpt.get('num_classes', len(self.classes) or 2))
            self.device_name = 'cuda' if settings.prefer_gpu and torch.cuda.is_available() else 'cpu'
            self.model = self._build_model(self.model_name, num_classes)
            self.model.load_state_dict(ckpt['model_state'])
            self.model.to(self.device_name).eval()
            self.ready = True
        except Exception as exc:
            self.ready = False
            self.error = f"Torch model load failed: {exc}"

    def predict(self, image_bytes: bytes) -> dict:
        if not self.ready:
            return {"ready": False, "error": self.error}
        import torch
        arr = to_preprocessed_tensor(image_bytes, self.img_size)
        with torch.no_grad():
            x = torch.from_numpy(arr).to(self.device_name)
            logits = self.model(x)
            probs = torch.softmax(logits, dim=1).detach().cpu().numpy()[0]
        idx = int(np.argmax(probs))
        return {
            "ready": True,
            "model_type": "torch",
            "path": str(self.path),
            "class_index": idx,
            "label": self.classes[idx] if idx < len(self.classes) else str(idx),
            "confidence": float(probs[idx]),
            "probabilities": {self.classes[i] if i < len(self.classes) else str(i): float(probs[i]) for i in range(len(probs))},
            "device": self.device_name,
        }

class OnnxImageModel:
    def __init__(self, path: Path, classes: list[str], img_size: int = 224):
        self.path = path
        self.classes = classes
        self.img_size = img_size
        self.ready = False
        self.error = None
        self.session = None
        self.input_name = None
        self._load()

    def _load(self):
        try:
            import onnxruntime as ort
            providers = ['CUDAExecutionProvider','CPUExecutionProvider'] if settings.prefer_gpu else ['CPUExecutionProvider']
            available = ort.get_available_providers()
            providers = [p for p in providers if p in available] or ['CPUExecutionProvider']
            self.session = ort.InferenceSession(str(self.path), providers=providers)
            self.input_name = self.session.get_inputs()[0].name
            self.ready = True
            self.providers = self.session.get_providers()
        except Exception as exc:
            self.ready = False
            self.error = f"ONNX model load failed: {exc}"
            self.providers = []

    def predict(self, image_bytes: bytes) -> dict:
        if not self.ready:
            return {"ready": False, "error": self.error}
        x = to_preprocessed_tensor(image_bytes, self.img_size)
        out = self.session.run(None, {self.input_name: x})[0]
        probs = Softmax.run(np.asarray(out))[0]
        idx = int(np.argmax(probs))
        return {
            "ready": True,
            "model_type": "onnx",
            "path": str(self.path),
            "class_index": idx,
            "label": self.classes[idx] if idx < len(self.classes) else str(idx),
            "confidence": float(probs[idx]),
            "probabilities": {self.classes[i] if i < len(self.classes) else str(i): float(probs[i]) for i in range(len(probs))},
            "providers": self.providers,
        }

class ModelRegistry:
    def __init__(self):
        self.loaded_at = None
        self.inr_auth = None
        self.usd_denom = None
        self.metrics = {}
        self.errors = []

    def load(self):
        self.errors = []
        base = settings.models_dir / 'currency'
        inr_pt = base / 'INR' / 'image_model_best.pt'
        if inr_pt.exists():
            self.inr_auth = TorchImageModel(inr_pt)
            if not self.inr_auth.ready: self.errors.append(self.inr_auth.error)
        usd_metrics = self._read_json(base / 'USD' / 'denomination_metrics.json') or {}
        usd_classes = usd_metrics.get('classes') or ['1 Dollar','2 Dollar','5 Dollar','10 Dollar','20 Dollar','50 Dollar','100 Dollar']
        usd_onnx = base / 'USD' / 'denomination_model.onnx'
        usd_pt = base / 'USD' / 'denomination_model_best.pt'
        if usd_onnx.exists():
            self.usd_denom = OnnxImageModel(usd_onnx, usd_classes, 224)
            if not self.usd_denom.ready and usd_pt.exists():
                self.usd_denom = TorchImageModel(usd_pt)
        elif usd_pt.exists():
            self.usd_denom = TorchImageModel(usd_pt)
        if self.usd_denom and not self.usd_denom.ready: self.errors.append(self.usd_denom.error)
        self.metrics = {
            'INR': self._read_json(base / 'INR' / 'image_metrics.json'),
            'USD': usd_metrics,
            'EUR': self._read_json(base / 'EUR' / 'fallback_rules.json'),
            'GBP': self._read_json(base / 'GBP' / 'fallback_rules.json'),
            'OTHER': self._read_json(base / 'OTHER' / 'fallback_rules.json'),
        }
        self.loaded_at = time.time()

    def _read_json(self, p: Path):
        try:
            return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None
        except Exception:
            return None

    def status(self):
        return {
            'loaded_at': self.loaded_at,
            'models_dir': str(settings.models_dir),
            'prefer_gpu': settings.prefer_gpu,
            'models': {
                'INR_authenticity': {
                    'ready': bool(self.inr_auth and self.inr_auth.ready),
                    'type': 'torch_mobilenet_v3_large',
                    'classes': self.inr_auth.classes if self.inr_auth else [],
                    'metrics': self.metrics.get('INR'),
                    'error': None if self.inr_auth and self.inr_auth.ready else (self.inr_auth.error if self.inr_auth else 'missing'),
                },
                'USD_denomination': {
                    'ready': bool(self.usd_denom and self.usd_denom.ready),
                    'type': 'onnx_or_torch_mobilenet_v3_large',
                    'classes': self.usd_denom.classes if self.usd_denom else [],
                    'metrics': self.metrics.get('USD'),
                    'error': None if self.usd_denom and self.usd_denom.ready else (self.usd_denom.error if self.usd_denom else 'missing'),
                },
                'EUR_authenticity_engine': {'ready': True, 'metrics': self.metrics.get('EUR')},
                'GBP_authenticity_engine': {'ready': True, 'metrics': self.metrics.get('GBP')},
                'OTHER_authenticity_engine': {'ready': True, 'metrics': self.metrics.get('OTHER')},
            },
            'errors': self.errors,
        }

registry = ModelRegistry()
