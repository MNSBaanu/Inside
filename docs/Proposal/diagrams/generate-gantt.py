"""Generate Scrum sprint Gantt chart for Inside proposal."""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

COLOR_LIGHT = "#B1DDF0"
COLOR_DARK = "#10739e"
COLOR_TEXT_DARK = "#10739e"
COLOR_GRID = "#d0e4ef"

# (sprint label, activity inside bar)
SPRINTS = [
    ("Sprint 1", "Requirements &\nproduct backlog"),
    ("Sprint 2", "Architecture &\nproject setup"),
    ("Sprint 3", "User accounts &\nauthentication"),
    ("Sprint 4", "Discovery &\nsearch filters"),
    ("Sprint 5", "Moodboards &\nfit scoring"),
    ("Sprint 6", "Proposals &\nselection"),
    ("Sprint 7", "Messaging &\nnotifications"),
    ("Sprint 8", "Workspace &\nworkflow"),
    ("Sprint 9", "Reviews &\ntrust features"),
    ("Sprint 10", "Payments &\nmobile app"),
    ("Sprint 11", "Testing &\ndocumentation"),
]

BAR_WEEKS = 2
BAR_HEIGHT = 0.78
LABEL_X = -3.8

# Sprint 1–6: full-width bar inside the 2-week slot (no overlap past week boundaries)
WIDE_COUNT = 6
WIDE_PAD_X = 0.02
WIDE_BAR_W = BAR_WEEKS - 2 * WIDE_PAD_X
WIDE_BAR_H = 0.9
WIDE_FONT = 7.4

NARROW_PAD_X = 0.06
NARROW_BAR_W = BAR_WEEKS - 2 * NARROW_PAD_X
NARROW_FONT = 7.2


fig, ax = plt.subplots(figsize=(17, 8.5))
fig.patch.set_facecolor("white")

n = len(SPRINTS)
for i, (sprint_label, activity) in enumerate(SPRINTS):
    y = n - i
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

    bar = FancyBboxPatch(
        (bar_x, y - bar_h / 2),
        bar_w,
        bar_h,
        boxstyle="round,pad=0.008,rounding_size=0.05",
        facecolor=color,
        edgecolor=COLOR_DARK,
        linewidth=1.2,
    )
    ax.add_patch(bar)

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

    text_x = bar_x + bar_w / 2
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
        activity,
        ha="center",
        va="center",
        fontsize=font_size,
        color=text_color,
        fontweight="medium",
        linespacing=1.1,
        zorder=4,
    )
    label.set_clip_path(clip_rect)

ax.set_xlim(-5, 22.5)
ax.set_ylim(0.25, n + 0.75)
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

fig.subplots_adjust(left=0.16, right=0.98, top=0.9, bottom=0.1)

plt.savefig("07-gantt-chart.png", dpi=220, bbox_inches="tight", facecolor="white")
print("Saved 07-gantt-chart.png")
