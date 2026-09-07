#!/usr/bin/env python3
import pathlib
_here = pathlib.Path(__file__).resolve().parent
code = (_here / "celestine_part1.py").read_text(encoding="utf-8")
code += (_here / "celestine_part2.py").read_text(encoding="utf-8")
exec(compile(code, str(_here / "celestine_assembled.py"), "exec"), globals())
