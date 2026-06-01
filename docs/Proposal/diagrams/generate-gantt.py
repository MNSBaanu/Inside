"""Generate Scrum sprint Gantt chart for Inside proposal."""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

COLOR_LIGHT = "#B1DDF0"
COLOR_DARK = "#10739e"
COLOR_TEXT_DARK = "#10739e"
COLOR_GRID = "#d0e4ef"
COLOR_CONTINUOUS = "#e8f4fa"

# (sprint label, activity inside bar)
SPRINTS = [
    ("Sprint 1", "Requirements &\nProduct Backlog"),
    ("Sprint 2", "Architecture &\nProject Setup"),
    ("Sprint 3", "User Accounts &\nAuthentication"),
    ("Sprint 4", "Discovery &\nSearch Filters"),
    ("Sprint 5", "Moodboards, Briefs\n& Matching"),
    ("Sprint 6", "Requests, Proposals\n& Selection"),
    ("Sprint 7", "Messaging &\nNotifications"),
    ("Sprint 8", "Workspace, Workflow\n& Timelines"),
    ("Sprint 9", "Reviews, Verification\n& Safety"),
    ("Sprint 10", "Payments &\nMobile App"),
    ("Sprint 11", "Integration, Testing\n& Documentation"),
]

# (left label, bar label, first sprint index 0-based, last sprint index inclusive)
CONTINUOUS = [
    ("Documentation Updates", "Documentation Updates", 1, 10),
    ("Continuous Testing", "Continuous Testing", 2, 10),
]

BAR_WEEKS = 2
BAR_HEIGHT = 0.78
LABEL_X = -3.8

WIDE_COUNT = 11
WIDE_PAD_X = 0.02
WIDE_BAR_W = BAR_WEEKS - 2 * WIDE_PAD_X
WIDE_BAR_H = 0.9
WIDE_FONT = 7.0

NARROW_PAD_X = 0.06
NARROW_BAR_W = BAR_WEEKS - 2 * NARROW_PAD_X
NARROW_FONT = 7.2

CONT_PAD_X = 0.04
CONT_BAR_H = 0.72
CONT_FONT = 8.5


def add_bar(ax, bar_x, bar_w, y, bar_h, facecolor, edgecolor, linewidth=1.2, linestyle="-"):
    bar = FancyBboxPatch(
        (bar_x, y - bar_h / 2),
        bar_w,
        bar_h,
        boxstyle="round,pad=0.008,rounding_size=0.05",
        facecolor=facecolor,
        edgecolor=edgecolor,
        linewidth=linewidth,
        linestyle=linestyle,
    )
    ax.add_patch(bar)
    return bar


def add_clipped_label(ax, text_x, y, text, bar_x, bar_w, bar_h, fontsize, color, fontweight="medium"):
    clip_rect = Rectangle(
        (bar_x, y - bar_h / 2),
        bar_w,
        bar_h,
        transform=ax.transData,
        visible=False,
    )
    ax.add_patch(clip_rect)
    label = ax.text(
        text_x,
        y,
        text,
        ha="center",
        va="center",
        fontsize=fontsize,
        color=color,
        fontweight=fontweight,
        linespacing=1.1,
        zorder=4,
    )
    label.set_clip_path(clip_rect)
    return label


n_sprints = len(SPRINTS)
n_continuous = len(CONTINUOUS)
n_rows = n_sprints + n_continuous

OUTPUT_DPI = 400

fig, ax = plt.subplots(figsize=(17, 10))
fig.patch.set_facecolor("white")

for i, (sprint_label, activity) in enumerate(SPRINTS):
    y = n_rows - i
    start = i * BAR_WEEKS
    color = COLOR_LIGHT if i % 2 == 0 else COLOR_DARK
    text_color = COLOR_TEXT_DARK if i % 2 == 0 else "white"

    if i < WIDE_COUNT:
        bar_x = start + WIDE_PAD_X
        bar_w = WIDE_BAR_W
        bar_h = WIDE_BAR_H
        font_size = WIDE_FONT
    else:
        bar_x = start + NARROW_PAD_X
        bar_w = NARROW_BAR_W
        bar_h = BAR_HEIGHT
        font_size = NARROW_FONT

    add_bar(ax, bar_x, bar_w, y, bar_h, color, COLOR_DARK)
    ax.text(
        LABEL_X,
        y,
        sprint_label,
        ha="left",
        va="center",
        fontsize=11,
        fontweight="bold",
        color=COLOR_TEXT_DARK,
        clip_on=True,
    )
    add_clipped_label(
        ax,
        bar_x + bar_w / 2,
        y,
        activity,
        bar_x,
        bar_w,
        bar_h,
        font_size,
        text_color,
    )

for j, (left_label, bar_label, sprint_start, sprint_end) in enumerate(CONTINUOUS):
    y = n_continuous - j
    bar_x = sprint_start * BAR_WEEKS + CONT_PAD_X
    bar_w = (sprint_end + 1) * BAR_WEEKS - bar_x - CONT_PAD_X
    bar_h = CONT_BAR_H

    add_bar(
        ax,
        bar_x,
        bar_w,
        y,
        bar_h,
        COLOR_CONTINUOUS,
        COLOR_DARK,
        linewidth=1.4,
        linestyle=(0, (4, 2)),
    )
    ax.text(
        LABEL_X,
        y,
        left_label,
        ha="left",
        va="center",
        fontsize=10,
        fontweight="bold",
        color=COLOR_TEXT_DARK,
        clip_on=True,
    )
    add_clipped_label(
        ax,
        bar_x + bar_w / 2,
        y,
        bar_label,
        bar_x,
        bar_w,
        bar_h,
        CONT_FONT,
        COLOR_TEXT_DARK,
        fontweight="bold",
    )

ax.set_xlim(-5, 22.5)
ax.set_ylim(0.25, n_rows + 0.75)
ax.set_xlabel("Project week", fontsize=11, color=COLOR_TEXT_DARK, fontweight="bold")
ax.set_xticks(range(1, 23))
ax.set_xticklabels([str(w) for w in range(1, 23)], fontsize=9)
ax.set_yticks([])
ax.set_title(
    "Inside — Scrum Project Plan\n22 weeks · 11 sprints · 2-week timeboxes",
    fontsize=14,
    fontweight="bold",
    color=COLOR_TEXT_DARK,
    pad=18,
)
ax.grid(axis="x", color=COLOR_GRID, linestyle="-", linewidth=0.8)
ax.set_axisbelow(True)
for spine in ["top", "right", "left"]:
    ax.spines[spine].set_visible(False)
ax.spines["bottom"].set_color(COLOR_GRID)

fig.subplots_adjust(left=0.18, right=0.98, top=0.9, bottom=0.1)

plt.savefig(
    "07-gantt-chart.png",
    dpi=OUTPUT_DPI,
    bbox_inches="tight",
    facecolor="white",
    pad_inches=0.08,
)
print(f"Saved 07-gantt-chart.png ({OUTPUT_DPI} dpi)")
