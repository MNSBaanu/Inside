"""Generate Interim Gantt: Work Completed (Blue) vs Work Remaining (Light)."""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Patch

COLOR_COMPLETED = "#10739e"
COLOR_REMAINING  = "#B1DDF0"
COLOR_TEXT       = "#10739e"
COLOR_GRID       = "#d0e4ef"
COLOR_ONGOING    = "#e8f4fa"

SPRINTS = [
    ("Sprint 1\nWeeks 1-2",  "Requirements & Product Backlog"),
    ("Sprint 2\nWeeks 3-4",  "Architecture & Project Setup"),
    ("Sprint 3\nWeeks 5-6",  "User Accounts & Authentication"),
    ("Sprint 4\nWeeks 7-8",  "Discovery & Search Filters"),
    ("Sprint 5\nWeeks 9-10", "Moodboards, Briefs & Matching"),
    ("Sprint 6\nWeeks 11-12","Requests, Proposals & Selection"),
    ("Sprint 7\nWeeks 13-14","Messaging & Notifications"),
    ("Sprint 8\nWeeks 15-16","Workspace, Workflow & Timelines"),
    ("Sprint 9\nWeeks 17-18","Reviews, Verification & Safety"),
    ("Sprint 10\nWeeks 19-20","Payments & Mobile App"),
    ("Sprint 11\nWeeks 21-22","Integration, Testing & Documentation"),
]

# (left_label, bar_label, start_sprint_idx, end_sprint_idx)
ONGOING = [
    ("Documentation Updates", "Doc Updates", 1, 10),
    ("Continuous Testing",    "Testing",      2, 10),
]

N_ROWS = len(SPRINTS) + len(ONGOING)
BAR_WEEKS = 2
LABEL_X  = -4.0
PAD_X    = 0.04
BAR_W    = BAR_WEEKS - 2 * PAD_X
BAR_H    = 0.78
FONT_SZ  = 6.8
CONT_H   = 0.65
CONT_F   = 7.5

# Which sprints have completed work (0-based index)
# Sprint 1 = fully done, Sprint 2 = half-done (diagrams done, env not)
COMPLETED_FULL   = {0}           # Sprint 1 fully completed
COMPLETED_PARTIAL = {1}          # Sprint 2 partially completed

def add_bar(ax, x, w, y, h, fc, ec, lw=1.2, ls="-"):
    b = FancyBboxPatch((x, y-h/2), w, h,
                       boxstyle="round,pad=0.008,rounding_size=0.05",
                       facecolor=fc, edgecolor=ec, linewidth=lw, linestyle=ls)
    ax.add_patch(b)
    return b

def clip_label(ax, tx, y, txt, bx, bw, bh, fs, c, fw="medium"):
    clip = Rectangle((bx, y-bh/2), bw, bh, transform=ax.transData, visible=False)
    ax.add_patch(clip)
    lbl = ax.text(tx, y, txt, ha="center", va="center",
                  fontsize=fs, color=c, fontweight=fw, linespacing=1.1, zorder=4)
    lbl.set_clip_path(clip)

fig, ax = plt.subplots(figsize=(16, 9))
fig.patch.set_facecolor("white")

row = N_ROWS
for i, (sprint_label, activity) in enumerate(SPRINTS):
    row -= 1
    start = i * BAR_WEEKS

    if i in COMPLETED_FULL:
        add_bar(ax, start+PAD_X, BAR_W, row, BAR_H, COLOR_COMPLETED, COLOR_COMPLETED)
        clip_label(ax, start+PAD_X+BAR_W/2, row, activity + " ✓",
                   start+PAD_X, BAR_W, BAR_H, 7.5, "white", "bold")
    elif i in COMPLETED_PARTIAL:
        # Split: left half completed, right half remaining
        hw = BAR_W / 2 - PAD_X/2
        add_bar(ax, start+PAD_X, hw, row, BAR_H, COLOR_COMPLETED, COLOR_COMPLETED)
        add_bar(ax, start+PAD_X+hw+PAD_X, hw, row, BAR_H, COLOR_REMAINING, COLOR_TEXT)
        clip_label(ax, start+PAD_X+hw/2, row, "Diagrams",
                   start+PAD_X, hw, BAR_H, 6, "white", "bold")
        clip_label(ax, start+PAD_X+hw+PAD_X+hw/2, row, "Setup",
                   start+PAD_X+hw+PAD_X, hw, BAR_H, 6, COLOR_TEXT, "bold")
    else:
        add_bar(ax, start+PAD_X, BAR_W, row, BAR_H, COLOR_REMAINING, COLOR_TEXT)
        clip_label(ax, start+PAD_X+BAR_W/2, row, activity,
                   start+PAD_X, BAR_W, BAR_H, FONT_SZ, COLOR_TEXT)

    ax.text(LABEL_X, row, sprint_label, ha="left", va="center",
            fontsize=9.5, fontweight="bold", color=COLOR_TEXT)

# Ongoing rows
for j, (left_label, bar_label, ss, se) in enumerate(ONGOING):
    row -= 1
    bar_x = ss * BAR_WEEKS + PAD_X
    bar_w = (se + 1) * BAR_WEEKS - bar_x - PAD_X
    add_bar(ax, bar_x, bar_w, row, CONT_H, COLOR_ONGOING, COLOR_TEXT,
            lw=1.4, ls=(0, (4, 2)))
    clip_label(ax, bar_x+bar_w/2, row, bar_label,
               bar_x, bar_w, CONT_H, CONT_F, COLOR_TEXT, "bold")
    ax.text(LABEL_X, row, left_label, ha="left", va="center",
            fontsize=9.5, fontweight="bold", color=COLOR_TEXT)

# Axes styling
ax.set_xlim(-5, 22.5)
ax.set_ylim(0.25, N_ROWS + 0.75)
ax.set_xlabel("Project Week", fontsize=11, color=COLOR_TEXT, fontweight="bold")
ax.set_xticks(range(1, 23))
ax.set_xticklabels([str(w) for w in range(1, 23)], fontsize=9)
ax.set_yticks([])
ax.set_title(
    "Inside — Interim Gantt Chart: Work Completed vs Remaining\n"
    "22 Weeks · 11 Sprints (2-Week Timeboxes) · Agile/Scrum",
    fontsize=14, fontweight="bold", color=COLOR_TEXT, pad=16)
ax.grid(axis="x", color=COLOR_GRID, linestyle="-", linewidth=0.8)
ax.set_axisbelow(True)
for s in ["top", "right", "left"]:
    ax.spines[s].set_visible(False)
ax.spines["bottom"].set_color(COLOR_GRID)

leg = ax.legend(
    handles=[
        Patch(facecolor=COLOR_COMPLETED, edgecolor=COLOR_COMPLETED, label="Completed (Documentation & Coding)"),
        Patch(facecolor=COLOR_REMAINING,  edgecolor=COLOR_TEXT,     label="Remaining"),
        Patch(facecolor=COLOR_ONGOING,    edgecolor=COLOR_TEXT,     label="Ongoing (Continuous)", linestyle=(0, (4, 2))),
    ],
    loc="lower right", fontsize=9.5, framealpha=0.9, title="Work Status",
    title_fontsize=10
)

fig.subplots_adjust(left=0.2, right=0.98, top=0.88, bottom=0.08)
import os
out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(out_dir, "10-gantt-interim.png")
plt.savefig(out_path, dpi=400, bbox_inches="tight",
            facecolor="white", pad_inches=0.08)
print(f"Saved {out_path} (400 dpi)")
