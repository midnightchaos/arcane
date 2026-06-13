import sys
import time

def print_slowly(text, delay=0.03):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def explain():
    ascii_art = """
    =====================================================================
          ___  ____  ____   __    _  _  ____  __  ____ 
         / __)(  __)(  _ \ /  \  / )( \(  __)/  \(  _ \
        ( (__  ) _)  )   /(  O ) ) \/ ( ) _)(  O ))   /
         \___)(____)(__\_) \__/  \____/(__)  \__/(__\_)

                   ARCANE12 SYSTEM OVERVIEW
    =====================================================================
    """
    print(ascii_art)
    time.sleep(0.5)

    explanation = """
Welcome to Arcane12! Here is a breakdown of what this project does and its architecture:

1. CORE MISSION:
   Arcane12 is a Hybrid Accident Detection System and Performance Analytics platform. 
   It leverages intelligent agents to track execution latency, workflow success rates, 
   chat response times, and error frequencies.

2. ARCHITECTURE:
   - Frontend: A modern web interface built with React, Vite, and TypeScript (Tailwind CSS for styling).
   - Backend: A Python-based server (FastAPI/Flask) that handles data processing, PDF generation, 
     and intelligent system workflows.
   - Database: Uses `arcane.db` to store system runtime performance metrics, logs, and game progress.

3. KEY FEATURES:
   - Real System Runtime Analytics: Extracts data directly from `arcane.db` to calculate metrics like 
     Accuracy, Precision, Recall, and F1-Score.
   - Graph Analytics: Generates Codebase Knowledge Graphs (nodes, edges, communities).
   - PDF/Word Reporting: Automatically compiles data into professional system state reports.
   - Cognitive Chat Games: Interactive chat-stream games driven by AI to simulate real-time workflows.

4. GETTING STARTED:
   - Run `fresh_install.bat` to automatically setup the environment, install Node & Python dependencies, 
     and configure the `.env` variables.
   - Execute `run.bat` to start both the frontend and backend servers.

=====================================================================
    """
    
    print_slowly(explanation, delay=0.01)

if __name__ == "__main__":
    explain()
