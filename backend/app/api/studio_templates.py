"""
Studio Templates
Static JSON definitions for pre-built agent pipelines
"""

def get_templates():
    return [
        {
            "id": "tpl-research-report",
            "name": "Research & Report",
            "description": "Deep logical reasoning followed by analysis and structured planning.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "What is the future of AGI?"}},
                {"id": "n2", "type": "reasoner", "position": {"x": 400, "y": 100}, "data": {"prompt": "Analyze logical implications"}},
                {"id": "n3", "type": "analyst", "position": {"x": 700, "y": 100}, "data": {"focus": "Quality & Ethics"}},
                {"id": "n4", "type": "planner", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Create roadmap"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-coder-runner",
            "name": "Code Generator & Runner",
            "description": "Describe a script, generate the code, and execute it instantly.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Write a python script to calculate fibonacci"}},
                {"id": "n2", "type": "coder", "position": {"x": 400, "y": 100}, "data": {"language": "python"}},
                {"id": "n3", "type": "execution", "position": {"x": 700, "y": 100}, "data": {"language": "python"}},
                {"id": "n4", "type": "outputText", "position": {"x": 1000, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-pdf-summarizer",
            "name": "PDF Summarizer",
            "description": "Extract text from PDF, summarize via Memory, and export to PDF.",
            "nodes": [
                {"id": "n1", "type": "inputPdf", "position": {"x": 100, "y": 100}, "data": {}},
                {"id": "n2", "type": "memory", "position": {"x": 400, "y": 100}, "data": {"prompt": "Summarize key findings"}},
                {"id": "n3", "type": "analyst", "position": {"x": 700, "y": 100}, "data": {"focus": "Insights"}},
                {"id": "n4", "type": "outputPdf", "position": {"x": 1000, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-goal-decomposer",
            "name": "Goal Decomposer",
            "description": "Break a massive goal into steps and have an agent execute step detail.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Launch a successful SaaS in 3 months"}},
                {"id": "n2", "type": "planner", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "executor", "position": {"x": 700, "y": 100}, "data": {"prompt": "Detail the first 3 steps"}},
                {"id": "n4", "type": "outputText", "position": {"x": 1000, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-data-insight",
            "name": "Data Insight Pipeline",
            "description": "Analyze CSV data through an Analyst and a Reasoner for deep meaning.",
            "nodes": [
                {"id": "n1", "type": "inputExcel", "position": {"x": 100, "y": 100}, "data": {}},
                {"id": "n2", "type": "analyst", "position": {"x": 400, "y": 100}, "data": {"focus": "Trends & Anomalies"}},
                {"id": "n3", "type": "reasoner", "position": {"x": 700, "y": 100}, "data": {"prompt": "What does this mean for the business?"}},
                {"id": "n4", "type": "outputExcel", "position": {"x": 1000, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-debug-fix",
            "name": "Debug & Fix Assistant",
            "description": "Input a bug, generate fix, run tests, and analyze results.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Fix this error: IndexError: list index out of range"}},
                {"id": "n2", "type": "coder", "position": {"x": 400, "y": 100}, "data": {"prompt": "Rewrite to add bounds checking"}},
                {"id": "n3", "type": "execution", "position": {"x": 700, "y": 100}, "data": {"language": "python"}},
                {"id": "n4", "type": "analyst", "position": {"x": 1000, "y": 100}, "data": {"focus": "Safety"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-meeting-notes",
            "name": "Meeting Notes → Action Items",
            "description": "Memory summarizes notes, Planner builds plan, Executor details tasks.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Meeting: Discussed new logo design, deadline next Friday."}},
                {"id": "n2", "type": "memory", "position": {"x": 400, "y": 100}, "data": {"prompt": "Summarize key decisions"}},
                {"id": "n3", "type": "planner", "position": {"x": 700, "y": 100}, "data": {"prompt": "Assign owners to tasks"}},
                {"id": "n4", "type": "executor", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Draft email to owners"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-full-chain",
            "name": "Full Agent Chain",
            "description": "The ultimate chain: Reason -> Plan -> Code -> Run -> Review.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 50, "y": 100}, "data": {"text": "Design a blockchain in Python"}},
                {"id": "n2", "type": "reasoner", "position": {"x": 300, "y": 100}, "data": {}},
                {"id": "n3", "type": "planner", "position": {"x": 550, "y": 100}, "data": {}},
                {"id": "n4", "type": "coder", "position": {"x": 800, "y": 100}, "data": {}},
                {"id": "n5", "type": "execution", "position": {"x": 1050, "y": 100}, "data": {}},
                {"id": "n6", "type": "analyst", "position": {"x": 1300, "y": 100}, "data": {}},
                {"id": "n7", "type": "outputText", "position": {"x": 1550, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True},
                {"id": "e6", "source": "n6", "target": "n7", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-dev-persona",
            "name": "AI Dev Persona",
            "description": "Senior React Developer persona followed by code generation and execution.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Create a glassmorphism login form with Tailwind"}},
                {"id": "n2", "type": "chameleon", "position": {"x": 400, "y": 100}, "data": {"persona": "Senior Frontend Architect", "prompt": "Review requirement & write code"}},
                {"id": "n3", "type": "coder", "position": {"x": 700, "y": 100}, "data": {"language": "typescript"}},
                {"id": "n4", "type": "execution", "position": {"x": 1000, "y": 100}, "data": {"language": "javascript"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-market-analyst",
            "name": "Market Analyst",
            "description": "Web search for real-time info, Analyst for insights, Oracle for forecasting.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Current price of Bitcoin and main trends"}},
                {"id": "n2", "type": "search", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "analyst", "position": {"x": 700, "y": 100}, "data": {"focus": "Economic Impact"}},
                {"id": "n4", "type": "oracle", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Predict 30-day outlook"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-secure-sql",
            "name": "Secure SQL Assistant",
            "description": "Natural language to SQL, execution on DB, and security audit via Sentinel.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Show me total sales by region"}},
                {"id": "n2", "type": "sqlAgent", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "sentinel", "position": {"x": 700, "y": 100}, "data": {"rules": "Check for SQL injection and PII leakage"}},
                {"id": "n4", "type": "outputText", "position": {"x": 1000, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-self-correct",
            "name": "Self-Correction Loop",
            "description": "Coder generates JSON, Validator checks schema, Branch routes results.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Generate a user profile object in JSON"}},
                {"id": "n2", "type": "coder", "position": {"x": 400, "y": 100}, "data": {"language": "javascript", "prompt": "Strictly JSON"}},
                {"id": "n3", "type": "validator", "position": {"x": 700, "y": 100}, "data": {"validationType": "JSON Schema", "rules": "{\"type\":\"object\"}"}},
                {"id": "n4", "type": "branch", "position": {"x": 1000, "y": 100}, "data": {"condition": "input.includes('✓')"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-vision-coder",
            "name": "Visual UI to Code",
            "description": "See a UI mockup, convert to spec via Alchemist, generate code, and run it.",
            "nodes": [
                {"id": "n1", "type": "vision", "position": {"x": 100, "y": 100}, "data": {"prompt": "Describe the layout and components"}},
                {"id": "n2", "type": "alchemist", "position": {"x": 400, "y": 100}, "data": {"format": "JSON Component Spec"}},
                {"id": "n3", "type": "coder", "position": {"x": 700, "y": 100}, "data": {"language": "typescript"}},
                {"id": "n4", "type": "execution", "position": {"x": 1000, "y": 100}, "data": {"language": "javascript"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-rag-researcher",
            "name": "Autonomous RAG Researcher",
            "description": "Search web, store results in RAG, reason about them, and retrieve context.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "History of quantum computing"}},
                {"id": "n2", "type": "search", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "chronicler", "position": {"x": 700, "y": 100}, "data": {"namespace": "research"}},
                {"id": "n4", "type": "reasoner", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Synthesize findings into key milestones"}},
                {"id": "n5", "type": "chronicler", "position": {"x": 1300, "y": 100}, "data": {"namespace": "research", "prompt": "Recall related 1990s breakthroughs"}},
                {"id": "n6", "type": "outputText", "position": {"x": 1600, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True},
                {"id": "e5", "source": "n5", "target": "n6", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-content-factory",
            "name": "Creative Content Factory",
            "description": "Write as a Persona, format as Markdown, and audit for safety.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Benefits of AI in education"}},
                {"id": "n2", "type": "chameleon", "position": {"x": 400, "y": 100}, "data": {"persona": "Futurist Author"}},
                {"id": "n3", "type": "alchemist", "position": {"x": 700, "y": 100}, "data": {"format": "Markdown Article"}},
                {"id": "n4", "type": "sentinel", "position": {"x": 1000, "y": 100}, "data": {"rules": "No bias, factual tone"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-smart-assistant",
            "name": "Smart Assistant (RAG)",
            "description": "Look up past context, reason, remember new fact, and respond.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Update my preference for dark mode"}},
                {"id": "n2", "type": "chronicler", "position": {"x": 400, "y": 100}, "data": {"namespace": "user_prefs", "prompt": "Recall current theme preference"}},
                {"id": "n3", "type": "reasoner", "position": {"x": 700, "y": 100}, "data": {"prompt": "Decide on final preference"}},
                {"id": "n4", "type": "chronicler", "position": {"x": 1000, "y": 100}, "data": {"namespace": "user_prefs"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-comp-intel",
            "name": "Competitive Intelligence",
            "description": "Search competitors, forecast trends, and plan counter-strategy.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Tesla market share 2024"}},
                {"id": "n2", "type": "search", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "oracle", "position": {"x": 700, "y": 100}, "data": {"prompt": "Predict 2025 moves"}},
                {"id": "n4", "type": "planner", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Strategy roadmap"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-code-auditor",
            "name": "Secure Code Auditor",
            "description": "Input code, audit safety, provide technical analysis, and refactor.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "def upload(f): open(f, 'w').write('hi')"}},
                {"id": "n2", "type": "sentinel", "position": {"x": 400, "y": 100}, "data": {"rules": "No file injection"}},
                {"id": "n3", "type": "analyst", "position": {"x": 700, "y": 100}, "data": {"focus": "Security"}},
                {"id": "n4", "type": "coder", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Apply best security practices"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-pdf-to-db",
            "name": "Doc to Database Sync",
            "description": "Extract from PDF, validate JSON format, and save to SQL database.",
            "nodes": [
                {"id": "n1", "type": "inputPdf", "position": {"x": 100, "y": 100}, "data": {}},
                {"id": "n2", "type": "alchemist", "position": {"x": 400, "y": 100}, "data": {"format": "JSON Rows"}},
                {"id": "n3", "type": "validator", "position": {"x": 700, "y": 100}, "data": {"validationType": "JSON Schema"}},
                {"id": "n4", "type": "sqlAgent", "position": {"x": 1000, "y": 100}, "data": {"prompt": "Insert these into users table"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        },
        {
            "id": "tpl-social-monitor",
            "name": "Social Sentiment Bot",
            "description": "Search web for news, analyze sentiment, and draft persona response.",
            "nodes": [
                {"id": "n1", "type": "inputText", "position": {"x": 100, "y": 100}, "data": {"text": "Reaction to new product launch"}},
                {"id": "n2", "type": "search", "position": {"x": 400, "y": 100}, "data": {}},
                {"id": "n3", "type": "analyst", "position": {"x": 700, "y": 100}, "data": {"focus": "Sentiment"}},
                {"id": "n4", "type": "chameleon", "position": {"x": 1000, "y": 100}, "data": {"persona": "PR Manager"}},
                {"id": "n5", "type": "outputText", "position": {"x": 1300, "y": 100}, "data": {}}
            ],
            "edges": [
                {"id": "e1", "source": "n1", "target": "n2", "animated": True},
                {"id": "e2", "source": "n2", "target": "n3", "animated": True},
                {"id": "e3", "source": "n3", "target": "n4", "animated": True},
                {"id": "e4", "source": "n4", "target": "n5", "animated": True}
            ],
            "nodeConfigs": {}
        }
    ]
