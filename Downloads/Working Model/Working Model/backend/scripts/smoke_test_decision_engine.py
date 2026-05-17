from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))
from app.services.model_registry import registry
from app.services.risk_engine import analyze_batch_banknotes

registry.load()
print('Model status loaded:', registry.status()['models'].keys())
print('Decision engine import OK')
