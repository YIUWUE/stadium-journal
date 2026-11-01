"""Export tracked and non-ignored source files, without Git internals or caches."""
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
target = root.parent / "stadium-journal-source.zip"
files = subprocess.check_output(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root
).decode("utf-8").split("\0")
count = 0
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for relative in sorted(set(files)):
        if not relative:
            continue
        path = (root / relative).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f"Invalid source file: {relative}")
        archive.write(path, "stadium-journal/" + relative)
        count += 1
print(f"Exported {count} files: {target} ({target.stat().st_size:,} bytes)")
