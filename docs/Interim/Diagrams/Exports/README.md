# Diagram Exports

PNG exports of the Interim `.drawio` sources, grouped by report topic.

## Folders

| Folder | Report topic | Sources |
|--------|--------------|---------|
| `01-Requirements` | Requirements / functional scope | Use case |
| `02-Process-Design` | Process & interaction design | Activities, DFDs, sequences |
| `03-Object-Design` | Object model | Class diagram |
| `04-Database-Design` | Data model | ER diagram |
| `05-Architecture` | Software architecture | 3-layer architecture |
| `06-Project-Management` | Project plan | Gantt chart |

Each topic folder has a `README.md` with a short general explanation for every figure (for pasting near the image in the report).

## Re-export after editing a diagram

From PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "docs/Interim/Diagrams/export-diagrams.ps1"
```

### One-time CLI setup

The Microsoft Store / MSIX draw.io build cannot be called for headless export from this environment. A portable copy lives under `Diagrams/.tools/` (gitignored).

If `.tools/drawio/draw.io.exe` is missing:

1. Download the Windows zip from [draw.io Desktop releases](https://github.com/jgraph/drawio-desktop/releases) (file named like `draw.io-*-windows.zip`).
2. Extract so that `docs/Interim/Diagrams/.tools/drawio/draw.io.exe` exists.
3. Run `export-diagrams.ps1` again.
