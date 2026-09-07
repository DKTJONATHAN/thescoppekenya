#!/usr/bin/env python3
import base64, pathlib
here = pathlib.Path(__file__).resolve().parent
parts = sorted(here.glob("celestine_chunk_*.b64"))
b64 = "".join(p.read_text() for p in parts)
data = base64.b64decode(b64)
target = here / "_celestine_full.py"
target.write_bytes(data)
code = target.read_text(encoding="utf-8")
exec(compile(code, str(target), "exec"), globals())
