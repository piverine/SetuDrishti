import time
import os
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.rule import Rule
from rich import box

console = Console()

# ─────────────────────────────────────────────────────────
# DEMO DATA (Deterministic so Before/After match exactly)
# ─────────────────────────────────────────────────────────
PATIENTS = [
    ("BED-01", "SHARMA, R.", "Post-Op Pain (HR Spike)", "False Alarm"),
    ("BED-02", "PATEL, P.", "Anxiety / Panic Attack", "False Alarm"),
    ("BED-03", "KUMAR, A.", "Missing Lab Data (>12h old)", "False Alarm"),
    ("BED-04", "SINGH, K.", "Dehydration", "False Alarm"),
    ("BED-05", "MEHTA, D.", "CONFIRMED SEPSIS", "TRUE SEPSIS"), # The only real one
    ("BED-06", "JOSHI, S.", "Post-Op Pain (HR Spike)", "False Alarm"),
    ("BED-07", "VERMA, A.", "Caffeine-induced Tachycardia", "False Alarm"),
    ("BED-08", "GUPTA, P.", "Missing Lab Data (>12h old)", "False Alarm"),
    ("BED-09", "BHAT, S.", "Fever (Non-Infectious)", "False Alarm"),
    ("BED-10", "IYER, L.", "Anxiety / Panic Attack", "False Alarm"),
]

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show_phase_1_failure():
    """Shows the RAW AI flooding the ICU with alarms."""
    clear_screen()
    console.print(Rule("[bold red] PHASE 1: THE FAILURE (RAW XGBOOST AI) [/bold red]"))
    console.print(Align.center("[dim]Demonstrating Alarm Fatigue in the ICU[/dim]\n"))
    
    table = Table(box=box.MINIMAL_DOUBLE_HEAD, expand=True)
    table.add_column("Patient", justify="left", style="cyan", no_wrap=True)
    table.add_column("AI Prediction", justify="center", style="bold red")
    table.add_column("Nurse Pager Status", justify="right", style="bold bright_red")

    for bed, name, condition, truth in PATIENTS:
        time.sleep(0.4) # Add dramatic pause
        table.add_row(
            f"{bed} - {name}", 
            "🚨 SEPSIS DETECTED", 
            "🔔 PAGER RINGING"
        )
        clear_screen()
        console.print(Rule("[bold red] PHASE 1: THE FAILURE (RAW XGBOOST AI) [/bold red]"))
        console.print(Align.center("[dim]Demonstrating Alarm Fatigue in the ICU[/dim]\n"))
        console.print(table)

    # Summary Panel for Phase 1
    summary = Panel(
        Text("Total Alarms Triggered: 10\nReal Sepsis Cases: 1\nFalse Alarms: 9\n\nCLINICAL RESULT: NURSE BURNOUT / ALARM FATIGUE", justify="center", style="bold white"),
        border_style="red",
        title="[bold red]FAILURE METRICS[/bold red]"
    )
    console.print("\n")
    console.print(summary)

def show_phase_2_solution():
    """Shows the Dual-Engine filtering out the noise."""
    clear_screen()
    console.print(Rule("[bold green] PHASE 2: THE SOLUTION (DUAL-ENGINE FILTER) [/bold green]"))
    console.print(Align.center("[dim]XGBoost + Clinical Rules Engine[/dim]\n"))
    
    table = Table(box=box.MINIMAL_DOUBLE_HEAD, expand=True)
    table.add_column("Patient", justify="left", style="cyan", no_wrap=True)
    table.add_column("AI Prediction", justify="center")
    table.add_column("Clinical Rules Engine", justify="center")
    table.add_column("Nurse Pager Status", justify="right")

    for bed, name, condition, truth in PATIENTS:
        time.sleep(0.5)
        
        if truth == "False Alarm":
            ai_pred = "[red]🚨 SEPSIS DETECTED[/red]"
            rules = f"[yellow]Silenced: {condition}[/yellow]"
            pager = "[dim]✅ Silenced (Nurse Not Bothered)[/dim]"
        else:
            ai_pred = "[bold red]🚨 SEPSIS DETECTED[/bold red]"
            rules = "[bold red]CONFIRMED: Clinical Decline[/bold red]"
            pager = "[bold bright_red blink]🔔 PAGER RINGING (EMERGENCY)[/bold bright_red blink]"

        table.add_row(f"{bed} - {name}", ai_pred, rules, pager)
        
        clear_screen()
        console.print(Rule("[bold green] PHASE 2: THE SOLUTION (DUAL-ENGINE FILTER) [/bold green]"))
        console.print(Align.center("[dim]XGBoost + Clinical Rules Engine[/dim]\n"))
        console.print(table)

    # Summary Panel for Phase 2
    summary = Panel(
        Text("Total AI Alerts: 10\nSilenced by Rules Engine: 9\nActual Pager Alerts: 1\n\nCLINICAL RESULT: 100% FATIGUE ELIMINATED", justify="center", style="bold white"),
        border_style="green",
        title="[bold green]SUCCESS METRICS[/bold green]"
    )
    console.print("\n")
    console.print(summary)

if __name__ == "__main__":
    clear_screen()
    console.print("\n\n")
    console.print(Align.center("[bold cyan]OmniMed AI Suite — Presentation Mode[/bold cyan]"))
    console.print(Align.center("[dim]Press Enter to begin demonstration...[/dim]"))
    input()
    
    # Run Phase 1
    show_phase_1_failure()
    
    # Pause for the pitch
    console.print("\n[bold yellow]>> Explain the failure to the judge here.[/bold yellow]")
    console.print("[dim]Press Enter to deploy the Smart Filter Solution...[/dim]")
    input()
    
    # Run Phase 2
    show_phase_2_solution()
    
    console.print("\n[bold green]Presentation Complete.[/bold green]\n")