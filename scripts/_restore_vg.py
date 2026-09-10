#!/usr/bin/env python3
import base64
from pathlib import Path
parts = sorted(Path('scripts').glob('_vg_chunk_*.b64'))
data = base64.b64decode(''.join(p.read_text() for p in parts))
Path('scripts/voice_guard.py').write_bytes(data)
print('restored', len(data))
for p in parts:
    p.unlink(missing_ok=True)
Path(__file__).unlink(missing_ok=True)
