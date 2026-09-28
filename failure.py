import time
import random
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.rule import Rule
from rich import box

# --- SIMULATION SETTINGS ---
TOTAL_EVENTS = 30
SPEED = 0.8

PATIENTS = ["SHARMA, R.", "PATEL, P.", "KUMAR, A.", "SINGH, K.", "MEHTA, D.", "JOSHI, S.", "VERMA, A."]
CONDITIONS = [
    ("Post-Op Pain (HR Spike)", "FP"),
    ("Missing Lab Data (>12h old)", "FP"),
    ("Anxiety / Panic Attack", "FP"),
    ("Systemic Infection (Lactate 4.2)", "TP"), # True Sepsis
    ("Post-Op Pain (HR Spike)", "FP"),
    ("Dehydration", "FP")
]

class DualEngineSimulator:
    def __init__(self):
        self.raw_alarms = 0
        self.silenced_alarms = 0
        self.valid_alarms = 0
        self.history = []

    def generate_event(self):
        patient = random.choice(PATIENTS)
        condition, type_ = random.choice(CONDITIONS)
        
        # Raw XGBoost ALWAYS panics
        self.raw_alarms += 1
        xgb_status = "[bold red]🚨 SEPSIS ALERT[/bold red]"
        
        # Dual-Engine Logic
        if type_ == "FP":
            self.silenced_alarms += 1
            filter_status = f"[dim yellow]Silenced: {condition}[/dim yellow]"
            final_output = "[dim]✅ Nurse Not Bothered[/dim]"
        else:
            self.valid_alarms += 1
            filter_status = "[bold bright_red]CONFIRMED: Clinical Decline[/bold bright_red]"
            final_output = "[bold bright_red on white] 🚨 PAGING ICU TEAM 🚨 [/bold bright_red on white]"

        self.history.insert(0, (patient, xgb_status, filter_status, final_output))
        if len(self.history) > 10:
            self.history.pop()

    def render(self):
        # Top Scoreboard
        precision = (self.valid_alarms / max(1, self.valid_alarms)) * 100 if self.silenced_alarms > 0 else 0
        
        score_table = Table.grid(expand=True)
        score_table.add_column(justify="center")
        score_table.add_column(justify="center")
        score_table.add_column(justify="center")
        
        score_table.add_row(
            Text(f"Raw AI Alarms: {self.raw_alarms}", style="bold red"),
            Text(f"False Alarms Silenced: {self.silenced_alarms}", style="bold yellow"),
            Text(f"Valid Sepsis Alerts: {self.valid_alarms}", style="bold green")
        )
        score_panel = Panel(score_table, title="[bold cyan]Setu-Drishti Dual-Engine Performance[/bold cyan]", border_style="cyan")

        # Live Feed
        feed_table = Table(show_header=True, header_style="bold white", box=box.SIMPLE, expand=True)
        feed_table.add_column("Patient", width=12)
        feed_table.add_column("Phase 1: XGBoost AI", justify="center")
        feed_table.add_column("Phase 2: Clinical Rules Engine", justify="center")
        feed_table.add_column("Final System Action", justify="right")

        for row in self.history:
            feed_table.add_row(*row)

        feed_panel = Panel(feed_table, title="[bold]Real-Time Alert Filtering[/bold]", border_style="dim")

        # Combine
        from rich.console import Group
        return Group(score_panel, feed_panel)

def main():
    console = Console()
    console.clear()
    console.print(Rule("[bold cyan] OmniMed AI - Smart Filter Initialization [/bold cyan]"))
    time.sleep(1)

    sim = DualEngineSimulator()

    with Live(sim.render(), refresh_per_second=4, console=console) as live:
        for _ in range(TOTAL_EVENTS):
            sim.generate_event()
            live.update(sim.render())
            time.sleep(SPEED)

    console.print("\n[bold green]✅ Simulation Complete. Alarm Fatigue Eliminated.[/bold green]\n")

if __name__ == "__main__":
    main()