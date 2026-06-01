"""Generate Scrum sprint Gantt chart for Inside proposal."""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

COLOR_LIGHT = "#B1DDF0"
COLOR_DARK = "#10739e"
COLOR_TEXT_DARK = "#10739e"
COLOR_GRID = "#d0e4ef"

# (left label, activity text inside bar — 2 lines max)
SPRINTS = [
    ("Sprint 1", "Requirements, research\n& product backlog"),
    ("Sprint 2", "Architecture, database\ndesign & setup"),
    ("Sprint 3", "User management\n& authentication"),
    ("Sprint 4", "Portfolio, discovery\n& search filters"),
    ("Sprint 5", "Moodboards, briefs\n& fit scoring"),
    ("Sprint 6", "Requests, proposals\n& selection"),
    ("Sprint 7", "Messaging &\nnotifications"),
    ("Sprint 8", "Workspace, timelines\n& workflow"),
    ("Sprint 9", "Reviews, trust\n& verification"),
    ("Sprint 10", "Payments &\nmobile app"),
    ("Sprint 11", "Testing, UAT\n& documentation"),
]

BAR_WEEKS = 2
BAR_HEIGHT = 0.78
BAR_HEIGHT_WIDE = 0.86
BAR_WEEKS_WIDE = 2.18  # wider bars for Sprint 1–6 (text fit); still 2-week timeboxes
LABEL_X = -3.8


fig, ax = plt.subplots(figsize=(16, 8.5))
fig.patch.set_facecolor("white")

n = len(SPRINTS)
for i, (sprint_label, activity) in enumerate(SPRINTS):
    y = n - i
    start = i * BAR_WEEKS
    color = COLOR_LIGHT if i % 2 == 0 else COLOR_DARK
    text_color = COLOR_TEXT_DARK if i % 2 == 0 else "white"

    if i < 6:
        bar_w = BAR_WEEKS_WIDE
        bar_h = BAR_HEIGHT_WIDE
        bar_x = start + (BAR_WEEKS - bar_w) / 2
        font_size = 8
    else:
        bar_w = BAR_WEEKS - 0.08
        bar_h = BAR_HEIGHT
        bar_x = start + 0.04
        font_size = 7.5

    bar = FancyBboxPatch(
        (bar_x, y - bar_h / 2),
        bar_w,
        bar_h,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        facecolor=color,
        edgecolor=COLOR_DARK,
        linewidth=1.2,
        transform=ax.transData,
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
    )

    ax.text(
        start + BAR_WEEKS / 2,
        y,
        activity,
        ha="center",
        va="center",
        fontsize=font_size,
        color=text_color,
        fontweight="medium",
        linespacing=1.12,
        zorder=3,
    )

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
