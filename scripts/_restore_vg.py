#!/usr/bin/env python3
import base64
from pathlib import Path
parts = sorted(Path('scripts').glob('_vg_chunk_*.b64'))
if not parts:
    raise SystemExit('no chunks')
data = base64.b64decode(''.join(p.read_text().strip() for p in parts))
Path('scripts/voice_guard.py').write_bytes(data)
print('restored', len(data))
