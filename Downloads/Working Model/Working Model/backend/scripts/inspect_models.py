from pathlib import Path
import json
base = Path('models/currency')
for cur in ['INR','USD','EUR','GBP','OTHER']:
    print('\n==', cur, '==')
    d = base / cur
    if not d.exists():
        print('missing')
        continue
    for f in d.iterdir():
        print(f.name, f.stat().st_size)
    for name in ['image_metrics.json','denomination_metrics.json','fallback_rules.json']:
        p=d/name
        if p.exists():
            print(json.dumps(json.loads(p.read_text()), indent=2)[:1200])
