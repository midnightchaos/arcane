"""
Code Evaluator
Analyzes code quality, detects errors, and provides improvement suggestions
"""
from typing import Dict, List, Any, Optional
from app.core.agents import BaseAgent, CoderAgent
from app.config import settings
import re

class CodeEvaluator:
    """
    Evaluates code quality and provides detailed feedback
    """
    
    def __init__(self):
        self.coder_agent = CoderAgent()
        self.quality_thresholds = {
            "excellent": 90,
            "good": 75,
            "fair": 60,
            "poor": 40,
            "critical": 0
        }
    
    async def evaluate_code(
        self,
        code: str,
        language: str = "python",
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive code evaluation
        
        Returns:
            - quality_score: 0-100
            - issues: List of problems found
            - improvements: Suggested improvements
            - best_practices: What's done well
            - refactored_code: Improved version
        """
        
        # Perform multiple evaluations in parallel
        syntax_check = await self._check_syntax(code, language)
        security_check = await self._check_security(code, language)
        best_practices_check = await self._check_best_practices(code, language)
        performance_check = await self._check_performance(code, language)
        style_check = await self._check_style(code, language)
        
        # Calculate overall score
        quality_score = self._calculate_quality_score({
            "syntax": syntax_check,
            "security": security_check,
            "best_practices": best_practices_check,
            "performance": performance_check,
            "style": style_check
        })
        
        # Get improvement suggestions
        improvements = await self._generate_improvements(code, language, {
            "syntax": syntax_check,
            "security": security_check,
            "best_practices": best_practices_check,
            "performance": performance_check,
            "style": style_check
        })
        
        # Generate refactored code if score is below threshold
        refactored_code = None
        if quality_score < 85:
            refactored_code = await self._generate_refactored_code(code, language, improvements)
        
        return {
            "quality_score": quality_score,
            "quality_level": self._get_quality_level(quality_score),
            "checks": {
                "syntax": syntax_check,
                "security": security_check,
                "best_practices": best_practices_check,
                "performance": performance_check,
                "style": style_check
            },
            "critical_issues": self._extract_critical_issues({
                "syntax": syntax_check,
                "security": security_check,
                "best_practices": best_practices_check,
                "performance": performance_check,
                "style": style_check
            }),
            "warnings": self._extract_warnings({
                "syntax": syntax_check,
                "security": security_check,
                "best_practices": best_practices_check,
                "performance": performance_check,
                "style": style_check
            }),
            "best_practices_followed": self._extract_positives({
                "syntax": syntax_check,
                "security": security_check,
                "best_practices": best_practices_check,
                "performance": performance_check,
                "style": style_check
            }),
            "improvements": improvements,
            "refactored_code": refactored_code,
            "language": language
        }
    
    async def _check_syntax(self, code: str, language: str) -> Dict[str, Any]:
        """Check syntax correctness"""
        prompt = f"""
Analyze this {language} code for syntax errors:

```{language}
{code}
```

Check for:
1. Syntax errors
2. Undefined variables
3. Type errors
4. Import errors
5. Indentation issues

Provide:
- List of syntax errors with line numbers
- Severity (critical/warning)
- Suggestions to fix

Format as structured analysis."""

        result = await self.coder_agent.generate(prompt)
        return self._parse_check_result(result)
    
    async def _check_security(self, code: str, language: str) -> Dict[str, Any]:
        """Check security vulnerabilities"""
        prompt = f"""
Analyze this {language} code for security vulnerabilities:

```{language}
{code}
```

Check for:
1. SQL injection risks
2. XSS vulnerabilities
3. Hardcoded secrets/passwords
4. Insecure cryptography
5. Path traversal issues
6. Command injection
7. Unsafe deserialization
8. Missing input validation

Provide:
- List of security issues with line numbers
- Severity (critical/high/medium/low)
- Exploitation scenario
- Remediation steps

Format as structured analysis."""

        result = await self.coder_agent.generate(prompt)
        return self._parse_check_result(result)
    
    async def _check_best_practices(self, code: str, language: str) -> Dict[str, Any]:
        """Check adherence to best practices"""
        prompt = f"""
Analyze this {language} code for best practices:

```{language}
{code}
```

Check for:
1. Code organization and modularity
2. Function/method design
3. Error handling
4. Logging practices
5. Documentation/comments
6. Naming conventions
7. Code reusability
8. Separation of concerns
9. DRY principle
10. SOLID principles (if OOP)

Provide:
- What's done well
- What needs improvement
- Specific recommendations

Format as structured analysis."""

        result = await self.coder_agent.generate(prompt)
        return self._parse_check_result(result)
    
    async def _check_performance(self, code: str, language: str) -> Dict[str, Any]:
        """Check performance issues"""
        prompt = f"""
Analyze this {language} code for performance issues:

```{language}
{code}
```

Check for:
1. Inefficient algorithms (O(n²) where O(n) possible)
2. Unnecessary loops
3. Database query optimization
4. Memory leaks
5. Excessive object creation
6. Inefficient data structures
7. Missing caching opportunities
8. Blocking operations
9. Resource management

Provide:
- Performance bottlenecks with line numbers
- Impact assessment (high/medium/low)
- Optimization suggestions

Format as structured analysis."""

        result = await self.coder_agent.generate(prompt)
        return self._parse_check_result(result)
    
    async def _check_style(self, code: str, language: str) -> Dict[str, Any]:
        """Check code style and formatting"""
        
        style_guides = {
            "python": "PEP 8",
            "javascript": "Airbnb Style Guide",
            "typescript": "TypeScript Best Practices",
            "java": "Google Java Style",
            "go": "Effective Go"
        }
        
        guide = style_guides.get(language.lower(), "standard conventions")
        
        prompt = f"""
Analyze this {language} code for style issues according to {guide}:

```{language}
{code}
```

Check for:
1. Formatting consistency
2. Naming conventions
3. Line length
4. Whitespace usage
5. Comment style
6. Import organization
7. Code structure

Provide:
- Style violations with line numbers
- Severity (minor/moderate)
- Quick fixes

Format as structured analysis."""

        result = await self.coder_agent.generate(prompt)
        return self._parse_check_result(result)
    
    async def _generate_improvements(
        self,
        code: str,
        language: str,
        checks: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate prioritized improvement recommendations"""
        
        all_issues = []
        for check_type, check_result in checks.items():
            issues = check_result.get("issues", [])
            for issue in issues:
                all_issues.append({
                    "category": check_type,
                    **issue
                })
        
        # Sort by severity
        priority_map = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        sorted_issues = sorted(
            all_issues,
            key=lambda x: priority_map.get(x.get("severity", "info"), 5)
        )
        
        # Generate improvement recommendations
        improvements = []
        for issue in sorted_issues[:10]:  # Top 10 issues
            improvements.append({
                "priority": issue.get("severity", "medium"),
                "category": issue.get("category", "general"),
                "issue": issue.get("description", ""),
                "line": issue.get("line", "N/A"),
                "recommendation": issue.get("fix", ""),
                "impact": issue.get("impact", "code quality")
            })
        
        return improvements
    
    async def _generate_refactored_code(
        self,
        code: str,
        language: str,
        improvements: List[Dict[str, Any]]
    ) -> str:
        """Generate improved version of the code"""
        
        improvements_text = "\n".join([
            f"{i+1}. {imp['issue']} (Line {imp['line']}): {imp['recommendation']}"
            for i, imp in enumerate(improvements[:5])  # Top 5 improvements
        ])
        
        prompt = f"""
Refactor this {language} code by applying these improvements:

{improvements_text}

Original Code:
```{language}
{code}
```

Provide:
1. Refactored code with improvements applied
2. Comments explaining major changes
3. Ensure code remains functionally equivalent

Return ONLY the refactored code, no explanations."""

        result = await self.coder_agent.generate(prompt)
        refactored = result.get('response', '') if isinstance(result, dict) else str(result)
        
        # Extract code from markdown if present
        if "```" in refactored:
            code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', refactored, re.DOTALL)
            if code_blocks:
                return code_blocks[0].strip()
        
        return refactored.strip()
    
    def _calculate_quality_score(self, checks: Dict[str, Any]) -> int:
        """Calculate overall quality score 0-100"""
        
        weights = {
            "syntax": 0.25,
            "security": 0.30,
            "best_practices": 0.20,
            "performance": 0.15,
            "style": 0.10
        }
        
        total_score = 0
        
        for check_type, check_result in checks.items():
            issues = check_result.get("issues", [])
            
            # Calculate deductions based on severity
            deductions = 0
            for issue in issues:
                severity = issue.get("severity", "low")
                if severity in ["critical", "high"]:
                    deductions += 15
                elif severity == "medium":
                    deductions += 8
                elif severity == "low":
                    deductions += 3
            
            # Cap deductions at 100 per category
            deductions = min(deductions, 100)
            category_score = max(0, 100 - deductions)
            
            total_score += category_score * weights.get(check_type, 0.1)
        
        return int(total_score)
    
    def _get_quality_level(self, score: int) -> str:
        """Get quality level from score"""
        for level, threshold in self.quality_thresholds.items():
            if score >= threshold:
                return level
        return "critical"
    
    def _parse_check_result(self, result: Any) -> Dict[str, Any]:
        """Parse check result into structured format"""
        response_text = result.get('response', '') if isinstance(result, dict) else str(result)
        
        issues = []
        positives = []
        
        current_issue = {}
        for line in response_text.split('\n'):
            line = line.strip()
            
            # Try to extract structured information
            if 'line' in line.lower() and any(char.isdigit() for char in line):
                if current_issue:
                    issues.append(current_issue)
                current_issue = {"description": line}
            elif any(word in line.lower() for word in ['critical', 'high', 'medium', 'low']):
                if current_issue:
                    current_issue["severity"] = self._extract_severity(line)
            elif line and current_issue:
                current_issue["fix"] = line
        
        if current_issue:
            issues.append(current_issue)
        
        return {
            "issues": issues,
            "positives": positives,
            "full_report": response_text
        }
    
    def _extract_severity(self, text: str) -> str:
        """Extract severity level from text"""
        text = text.lower()
        if 'critical' in text:
            return 'critical'
        elif 'high' in text:
            return 'high'
        elif 'medium' in text:
            return 'medium'
        elif 'low' in text:
            return 'low'
        return 'info'
    
    def _extract_critical_issues(self, checks: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract critical issues from all checks"""
        critical = []
        
        for check_type, check_result in checks.items():
            issues = check_result.get("issues", [])
            for issue in issues:
                if issue.get("severity") in ["critical", "high"]:
                    critical.append({
                        "category": check_type,
                        "description": issue.get("description", ""),
                        "severity": issue.get("severity", "high"),
                        "line": issue.get("line", "N/A"),
                        "fix": issue.get("fix", "")
                    })
        
        return critical
    
    def _extract_warnings(self, checks: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract warnings from all checks"""
        warnings = []
        
        for check_type, check_result in checks.items():
            issues = check_result.get("issues", [])
            for issue in issues:
                if issue.get("severity") in ["medium", "low"]:
                    warnings.append({
                        "category": check_type,
                        "description": issue.get("description", ""),
                        "severity": issue.get("severity", "medium"),
                        "line": issue.get("line", "N/A"),
                        "fix": issue.get("fix", "")
                    })
        
        return warnings
    
    def _extract_positives(self, checks: Dict[str, Any]) -> List[str]:
        """Extract positive aspects from all checks"""
        positives = []
        
        for check_type, check_result in checks.items():
            check_positives = check_result.get("positives", [])
            positives.extend(check_positives)
        
        # Also extract from full reports
        for check_type, check_result in checks.items():
            report = check_result.get("full_report", "")
            for line in report.split('\n'):
                if any(word in line.lower() for word in ['good', 'well', 'correct', 'proper']):
                    if line not in positives:
                        positives.append(line.strip())
        
        return positives[:10]  # Top 10
