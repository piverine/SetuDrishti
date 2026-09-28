import time
import random
import os
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.rule import Rule
from rich import box

console = Console()

# --- 1. DYNAMIC DATA GENERATOR ---
def generate_live_patients(num_patients=10):
    """Generates random patient vitals so it is different every run."""
    first_names = ["R.", "P.", "A.", "K.", "D.", "S.", "M.", "V.", "N.", "T."]
    last_names = ["SHARMA", "PATEL", "KUMAR", "SINGH", "MEHTA", "JOSHI", "VERMA", "GUPTA", "DAS", "RAO"]
    
    patients = []
    # Guarantee at least 1 real sepsis case for the demo
    true_sepsis_index = random.randint(0, num_patients - 1)
    
    for i in range(num_patients):
        bed = f"BED-{str(i+1).zfill(2)}"
        name = f"{random.choice(last_names)}, {random.choice(first_names)}"
        
        if i == true_sepsis_index:
            # True Sepsis: High HR, Low BP, High Temp
            vitals = {"HR": random.randint(110, 130), "MAP": random.randint(50, 64), "Temp": random.uniform(38.5, 40.0), "Post_Op": False}
        else:
            # False Alarms: High HR, but other vitals are stable
            reason = random.choice(["Post_Op", "Anxiety", "Dehydration"])
            is_post_op = True if reason == "Post_Op" else False
            vitals = {"HR": random.randint(105, 125), "MAP": random.randint(70, 90), "Temp": random.uniform(36.5, 37.5), "Post_Op": is_post_op}
            
        patients.append({"bed": bed, "name": name, "vitals": vitals})
        
    return patients

# --- 2. THE LOGIC ENGINES (Show this to the judge!) ---

def raw_xgboost_ai(vitals):
    """The Raw AI only looks at the Heart Rate spike and panics."""
    if vitals["HR"] > 100:
        return True # Trigger Alarm
    return False

def clinical_rules_engine(vitals):
    """The Smart Filter checks the CONTEXT before allowing the alarm."""
    # 1. Check for True Shock (Low Blood Pressure)
    if vitals["MAP"] < 65 and vitals["Temp"] > 38.0:
        return "CONFIRMED SEPSIS"
    
    # 2. Filter out Post-Surgery Pain
    if vitals["Post_Op"] == True:
        return "Silenced: Post-Op Pain"
        
    # 3. Filter out Anxiety/Dehydration (Normal BP and Temp)
    if vitals["MAP"] >= 65 and vitals["Temp"] <= 38.0:
        return "Silenced: Vitals Stable (No fever/shock)"
        
    return "Silenced: Unknown Noise"

# --- 3. PRESENTATION UI ---
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def run_simulation():
    patients = generate_live_patients(10)
    
    clear_screen()
    console.print(Rule("[bold cyan] DUAL-ENGINE CLINICAL SIMULATOR [/bold cyan]"))
    console.print(Align.center("[dim]Executing live vitals analysis...[/dim]\n"))
    
    table = Table(box=box.MINIMAL_DOUBLE_HEAD, expand=True)
    table.add_column("Patient", style="cyan")
    table.add_column("Live Vitals", style="white")
    table.add_column("Raw AI (XGBoost)", justify="center")
    table.add_column("Clinical Rules Filter", justify="center")
    table.add_column("Nurse Pager", justify="right")

    alarms_fired = 0
    alarms_silenced = 0

    for p in patients:
        time.sleep(0.6) # Simulate processing time
        
        vitals_str = f"HR:{p['vitals']['HR']} | MAP:{p['vitals']['MAP']} | Temp:{p['vitals']['Temp']:.1f}"
        
        # Step 1: Raw AI predicts
        ai_triggers = raw_xgboost_ai(p['vitals'])
        ai_text = "[bold red]🚨 SEPSIS[/bold red]" if ai_triggers else "[green]Stable[/green]"
        
        # Step 2: Rules Engine filters
        if ai_triggers:
            filter_decision = clinical_rules_engine(p['vitals'])
            if "Silenced" in filter_decision:
                rules_text = f"[yellow]{filter_decision}[/yellow]"
                pager_text = "[dim]✅ Silenced[/dim]"
                alarms_silenced += 1
            else:
                rules_text = f"[bold red]{filter_decision}[/bold red]"
                pager_text = "[bold bright_red blink]🔔 PAGER RINGING[/bold bright_red blink]"
                alarms_fired += 1
        else:
            rules_text = "-"
            pager_text = "-"

        table.add_row(f"{p['bed']} {p['name']}", vitals_str, ai_text, rules_text, pager_text)
        
        clear_screen()
        console.print(Rule("[bold cyan] DUAL-ENGINE CLINICAL SIMULATOR [/bold cyan]"))
        console.print(table)

    # Summary
    summary = Panel(
        Text(f"Total AI Alerts: 10\nSilenced by Logic: {alarms_silenced}\nReal Emergencies Paged: {alarms_fired}", justify="center", style="bold white"),
        border_style="green", title="[bold green]LIVE RESULTS[/bold green]"
    )
    console.print("\n")
    console.print(summary)

if __name__ == "__main__":
    run_simulation()