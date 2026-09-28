#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         ALARM FATIGUE SIMULATOR — Setu-Drishti × OmniMed AI Suite          ║
║         XGBoost Sepsis Model | Precision: 4% | Recall: 82%                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Run with:   pip install rich
            python alarm_fatigue_demo.py
"""

import time
import random
from collections import deque
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.rule import Rule
from rich import box

# ─────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────
TRUE_POS_PER_100   = 4     # Precision = 4%
FALSE_POS_PER_100  = 96    # 96 False Alarms per 100
ALARMS_PER_HOUR    = 100   # Total model alerts per ICU "hour"
HOUR_DURATION_SECS = 2.5   # Real-time seconds per simulated hour
TOTAL_HOURS        = 24
FEED_SIZE          = 18    # Visible rows in the alert feed

PATIENT_NAMES = [
    "SHARMA, RAJESH", "PATEL, PRIYA", "KUMAR, AMIT", "SINGH, KARAN",
    "MEHTA, DILIP", "JOSHI, SUNITA", "VERMA, ANIL", "GUPTA, POOJA",
    "BHAT, SURESH", "IYER, LAKSHMI", "RAO, VENKAT", "NAIR, DEEPA",
    "TIWARI, RAKESH", "MISHRA, KAVITA", "CHOPRA, RAHUL", "SINHA, NEETA",
    "AGARWAL, VIKAS", "PANDEY, GEETA", "JAIN, MOHIT", "DAS, SUJATA",
    "CHAUHAN, RAVI", "SAXENA, NEHA", "DUBEY, SUNIL", "MALHOTRA, INA",
]

BED_IDS = [f"BED-{str(i).zfill(2)}" for i in range(1, 25)]

RISK_SCORES_FP = lambda: random.randint(68, 88)
RISK_SCORES_TP = lambda: random.randint(89, 99)

NURSE_REACTIONS = [
    (0,    50,   "😐 Mildly Concerned",                 "green"),
    (50,   150,  "🙄 Eyebrows Raised",                  "green"),
    (150,  300,  "😒 Actively Sighing",                  "yellow"),
    (300,  450,  "🔕 Silencing Alarms",                  "yellow"),
    (450,  600,  "🎧 Noise-Cancelling Headphones On",    "orange1"),
    (600,  800,  "🗑️  Ignoring ALL Alerts",               "red"),
    (800,  1000, "😡 Considering Career Change",         "red"),
    (1000, 1200, "✍️  Writing Resignation Letter",        "bright_red"),
    (1200, 9999, "🚪 HAS QUIT. WARD UNMANNED.",          "bright_red"),
]

FP_REASONS = [
    "Post-op vitals mimicking sepsis",
    "Marathon runner elevated HR",
    "Anxiety-induced tachycardia",
    "Lab draw artifact — high WBC",
    "Febrile non-infectious response",
    "Corticosteroid-induced hyperglycemia",
    "Pain-related elevated vitals",
    "Dehydration — transient lactate",
    "Post-exercise SpO2 dip",
    "Caffeine-induced HR spike",
    "Epidural-related hypotension",
    "Post-transfusion inflammatory response",
    "Night-shift vitals measurement error",
    "Motion artifact on pulse oximeter",
    "Reaction to IV contrast dye",
]

TP_REASONS = [
    "CONFIRMED: Septic shock — cultures pending",
    "CONFIRMED: Pneumonia → systemic infection",
    "CONFIRMED: UTI with bacteremia",
    "CONFIRMED: Abdominal sepsis — OR STAT",
    "CONFIRMED: Multi-organ involvement detected",
]


# ─────────────────────────────────────────────────────────
# STATE
# ─────────────────────────────────────────────────────────
tp_count  = 0
fp_count  = 0
hour      = 0
feed: deque = deque(maxlen=FEED_SIZE)
critical_events = []  # Store TP timestamps for drama


# ─────────────────────────────────────────────────────────
# RENDER HELPERS
# ─────────────────────────────────────────────────────────
def get_nurse_status():
    for lo, hi, label, color in NURSE_REACTIONS:
        if lo <= fp_count < hi:
            return label, color
    return "SYSTEM FAILURE", "bright_red"


def render_scoreboard() -> Panel:
    nurse_label, nurse_color = get_nurse_status()
    precision_now = (tp_count / (tp_count + fp_count) * 100) if (tp_count + fp_count) > 0 else 0

    table = Table.grid(expand=True, padding=(0, 4))
    table.add_column(justify="center")
    table.add_column(justify="center")
    table.add_column(justify="center")
    table.add_column(justify="center")

    # Row 1: Values
    tp_text  = Text(f"✅  {tp_count}", style="bold bright_green", justify="center")
    fp_text  = Text(f"🚨  {fp_count}", style="bold bright_red", justify="center")
    prec_text = Text(f"⚠️   {precision_now:.1f}%", style="bold yellow", justify="center")
    hour_text = Text(f"🕐  Hour {hour:02d}/24", style="bold cyan", justify="center")

    table.add_row(tp_text, fp_text, prec_text, hour_text)

    # Row 2: Labels
    table.add_row(
        Text("SEPSIS CAUGHT", style="dim green", justify="center"),
        Text("FALSE ALARMS", style="dim red", justify="center"),
        Text("LIVE PRECISION", style="dim yellow", justify="center"),
        Text("ICU SHIFT", style="dim cyan", justify="center"),
    )

    # Nurse annoyance
    nurse_row = Table.grid(expand=True, padding=(1, 0))
    nurse_row.add_column(justify="center")
    nurse_row.add_row(
        Text(f"NURSE STATUS: {nurse_label}", style=f"bold {nurse_color}", justify="center")
    )

    from rich.console import Group
    content = Group(table, Rule(style="dim"), nurse_row)

    border_color = "bright_red" if fp_count > 600 else "cyan"
    return Panel(content, title="[bold cyan]📊 REAL-TIME SCOREBOARD[/bold cyan]",
                 border_style=border_color, padding=(0, 2))


def render_feed() -> Panel:
    table = Table(
        show_header=True, header_style="bold dim",
        box=box.MINIMAL, expand=True, padding=(0, 1)
    )
    table.add_column("TIME",   width=6,  style="dim")
    table.add_column("BED",    width=8)
    table.add_column("PATIENT NAME",     width=22)
    table.add_column("RISK",  width=6,  justify="right")
    table.add_column("RESULT", width=14)
    table.add_column("CLINICAL REASON",          min_width=36)

    for row in feed:
        table.add_row(*row)

    title = f"[bold]🔴 LIVE MODEL ALERT FEED  [dim](Last {FEED_SIZE} alerts shown)[/dim][/bold]"
    return Panel(table, title=title, border_style="dim", padding=(0, 1))


def render_math_panel() -> Panel:
    total = tp_count + fp_count
    fp_ratio = (fp_count / total * 100) if total > 0 else 0
    tp_ratio = (tp_count / total * 100) if total > 0 else 0

    lines = [
        Text("MODEL PERFORMANCE STATS", style="bold yellow", justify="center"),
        Text(""),
        Text(f"  Target: Recall = 82%      [ACHIEVED]", style="bold green"),
        Text(f"  Cost:   Precision = 4%    [DANGEROUS]", style="bold red"),
        Text(""),
        Text(f"  Of {total} total alerts fired:", style="white"),
        Text(f"  ✅  Real Sepsis :  {tp_count:>5}   ({tp_ratio:4.1f}%)", style="bright_green"),
        Text(f"  ❌  Fake Alarms :  {fp_count:>5}   ({fp_ratio:4.1f}%)", style="bright_red"),
        Text(""),
        Text(f"  Nurse acted on 1 in every", style="dim"),
        Text(f"  {(total // tp_count if tp_count > 0 else '∞'):>4} alerts fruitlessly.", style="bold bright_red"),
    ]
    content = Text("\n")
    for l in lines:
        content.append_text(l)
        content.append("\n")

    return Panel(content, title="[yellow]⚗️  ALARM FATIGUE ANALYSIS[/yellow]",
                 border_style="yellow", padding=(0, 2))


def make_alert_row(is_tp: bool, shift_hour: int) -> tuple:
    hour_str = f"{shift_hour:02d}:XX"
    bed      = random.choice(BED_IDS)
    name     = random.choice(PATIENT_NAMES)
    risk     = RISK_SCORES_TP() if is_tp else RISK_SCORES_FP()

    if is_tp:
        result_text  = Text("⚠ SEPSIS ⚠", style="bold bright_red on dark_red")
        reason_text  = Text(random.choice(TP_REASONS), style="bold bright_red")
        risk_text    = Text(f"{risk}%", style="bold red")
    else:
        result_text  = Text("False Alarm", style="dim yellow")
        reason_text  = Text(random.choice(FP_REASONS), style="dim")
        risk_text    = Text(f"{risk}%", style="yellow")

    return (hour_str, bed, name, risk_text, result_text, reason_text)


# ─────────────────────────────────────────────────────────
# LAYOUT
# ─────────────────────────────────────────────────────────
def build_layout() -> Layout:
    layout = Layout()
    layout.split_column(
        Layout(name="scoreboard", size=10),
        Layout(name="body"),
    )
    layout["body"].split_row(
        Layout(name="feed", ratio=2),
        Layout(name="math", ratio=1),
    )
    return layout


# ─────────────────────────────────────────────────────────
# MAIN SIMULATION LOOP
# ─────────────────────────────────────────────────────────
def main():
    global tp_count, fp_count, hour

    console = Console()
    console.clear()
    console.print()
    console.print(Rule("[bold cyan]  ALARM FATIGUE SIMULATOR — Setu-Drishti ICU  [/bold cyan]"))
    console.print(Align.center("[dim]XGBoost Sepsis Model | Precision: 4% | Recall: 82%[/dim]"))
    console.print(Align.center("[dim]Starting simulation in 3 seconds...[/dim]"))
    console.print()
    time.sleep(3)

    layout = build_layout()

    # Pre-fill feed with FP noise so it doesn't look empty at start
    for _ in range(FEED_SIZE // 2):
        feed.append(make_alert_row(False, 0))

    with Live(layout, refresh_per_second=10, screen=True, console=console):
        for h in range(1, TOTAL_HOURS + 1):
            hour = h

            # Each hour fires ALARMS_PER_HOUR alarms with 4% precision
            alerts_this_hour = []
            for _ in range(TRUE_POS_PER_100):
                alerts_this_hour.append(True)
            for _ in range(FALSE_POS_PER_100):
                alerts_this_hour.append(False)

            random.shuffle(alerts_this_hour)

            # Dole out alarms over the hour duration
            delay_per_alert = HOUR_DURATION_SECS / ALARMS_PER_HOUR

            for is_tp in alerts_this_hour:
                if is_tp:
                    tp_count += 1
                else:
                    fp_count += 1

                feed.append(make_alert_row(is_tp, h))

                layout["scoreboard"].update(render_scoreboard())
                layout["feed"].update(render_feed())
                layout["math"].update(render_math_panel())

                time.sleep(delay_per_alert)

    # ── FINAL SUMMARY ──
    console.clear()
    console.print()
    console.print(Rule("[bold red]  24-HOUR ICU SHIFT COMPLETE  [/bold red]"))
    console.print()

    total = tp_count + fp_count
    table = Table(title="FINAL ALARM FATIGUE REPORT", box=box.DOUBLE_EDGE,
                  border_style="red", show_header=True, header_style="bold")
    table.add_column("Metric",             style="cyan")
    table.add_column("Value",              style="white", justify="right")
    table.add_column("Clinical Reality",   style="dim")

    table.add_row("Total Alarms Fired",     f"{total}",                "Nurses had to assess every single one")
    table.add_row("✅ True Positives",       f"{tp_count}  (Sepsis caught)",   "Model correctly flagged sepsis")
    table.add_row("❌ False Alarms",         f"{fp_count}  (92%+ were noise)", "Healthy patients incorrectly flagged")
    table.add_row("Live Precision",         f"{tp_count/total*100:.1f}%",       "1 in {:.0f} alarms was real".format(total/max(tp_count,1)))
    table.add_row("Recalls Achieved",       "82%",                     "Disease not missed — but at what cost?")
    table.add_row("Nurse Annoyance Level",  get_nurse_status()[0],     "Staff trust destroyed by noise")
    table.add_row("Missed Sepsis (FN)",     f"~{round(TOTAL_HOURS * 5 * 0.18)}",  "Cases model missed entirely (18%)")

    console.print(Align.center(table))
    console.print()
    console.print(Align.center(Text(
        "⚠  CONCLUSION: A 4% Precision model creates Alarm Fatigue.\n"
        "   Nurses stop trusting the system. Real alerts drown in noise.\n"
        "   This is why Setu-Drishti uses a DUAL-ENGINE approach:\n"
        "   XGBoost + Clinical Rules to maximize BOTH Recall AND Precision.",
        style="bold yellow", justify="center"
    )))
    console.print()
    console.print(Rule("[dim]Setu-Drishti × OmniMed AI Suite — Hacknation 2.0[/dim]"))


if __name__ == "__main__":
    main()
