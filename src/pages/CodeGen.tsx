import React, { useState } from 'react';
import { Send, Copy, Download, CheckCircle, AlertCircle, Code2, FileCode, Terminal } from 'lucide-react';
import { chatService } from '../services/chatService';

interface CodeOutput {
  code: string;
  language: string;
  explanation: string;
  runGuide: {
    installation: string[];
    dependencies: string[];
    commands: string[];
    expectedOutput: string;
  };
}

interface CodeEvaluation {
  quality_score: number;
  quality_level: string;
  critical_issues: Array<{
    category: string;
    description: string;
    severity: string;
    line: string;
    fix: string;
  }>;
  warnings: Array<{
    category: string;
    description: string;
    severity: string;
    line: string;
    fix: string;
  }>;
  best_practices_followed: string[];
  improvements: Array<{
    priority: string;
    category: string;
    issue: string;
    line: string;
    recommendation: string;
  }>;
  refactored_code?: string;
}

const CodeGen: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'evaluate'>('generate');
  const [prompt, setPrompt] = useState('');
  const [userCode, setUserCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [codeOutput, setCodeOutput] = useState<CodeOutput | null>(null);
  const [evaluation, setEvaluation] = useState<CodeEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await chatService.sendMessage(
        'default-session',
        `Generate ${language} code: ${prompt}. Include complete working code, explanation, and detailed run guide with installation steps, dependencies, commands, and expected output.`,
        'coder'
      );

      // Parse response to extract code and guide
      // This is a simplified version - you'd want more robust parsing
      const responseContent = response.content || '';
      const codeMatch = responseContent.match(/```(\w+)?\n([\s\S]*?)```/);
      
      setCodeOutput({
        code: codeMatch ? codeMatch[2] : responseContent,
        language: codeMatch ? codeMatch[1] || language : language,
        explanation: responseContent.split('```')[0],
        runGuide: parseRunGuide(responseContent)
      });
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateCode = async () => {
    if (!userCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/code/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: userCode,
          language: language
        })
      });

      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error evaluating code:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseRunGuide = (_text: string): CodeOutput['runGuide'] => {
    // Simple parser - enhance as needed
    return {
      installation: ['pip install -r requirements.txt'],
      dependencies: ['requests', 'flask'],
      commands: ['python main.py'],
      expectedOutput: 'Server running on port 5000'
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Code2 className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-white">Code Generation & Analysis</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('generate')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <FileCode className="w-4 h-4 inline mr-2" />
              Generate Code
            </button>
            <button
              onClick={() => setMode('evaluate')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'evaluate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Evaluate Code
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Input */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col">
          <div className="bg-gray-900 p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {mode === 'generate' ? 'Describe What to Build' : 'Paste Your Code'}
              </h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {mode === 'generate' ? (
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Create a REST API for user authentication with JWT tokens..."
                  className="w-full h-64 bg-gray-900 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                />
                <button
                  onClick={handleGenerateCode}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Generate Code</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder="Paste your code here for quality analysis..."
                  className="w-full h-96 bg-gray-900 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                />
                <button
                  onClick={handleEvaluateCode}
                  disabled={loading || !userCode.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Analyze Code Quality</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="w-1/2 flex flex-col">
          {mode === 'generate' && codeOutput && (
            <>
              {/* Code Display */}
              <div className="flex-1 flex flex-col border-b border-gray-800">
                <div className="bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-white">Generated Code</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(codeOutput.code)}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => downloadCode(codeOutput.code, `code.${codeOutput.language}`)}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-950">
                  <pre className="text-gray-300 font-mono text-sm leading-relaxed">
                    <code>{codeOutput.code}</code>
                  </pre>
                </div>
              </div>

              {/* Run Guide */}
              <div className="h-64 overflow-auto bg-gray-900">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-semibold text-white flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-green-500" />
                    <span>How to Run</span>
                  </h3>
                </div>
                <div className="p-4 space-y-4 text-sm">
                  <div>
                    <h4 className="text-gray-400 font-medium mb-2">1. Install Dependencies</h4>
                    <div className="bg-gray-950 p-3 rounded border border-gray-800 font-mono text-gray-300">
                      {codeOutput.runGuide.installation.map((cmd, i) => (
                        <div key={i}>{cmd}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-400 font-medium mb-2">2. Run the Code</h4>
                    <div className="bg-gray-950 p-3 rounded border border-gray-800 font-mono text-gray-300">
                      {codeOutput.runGuide.commands.map((cmd, i) => (
                        <div key={i}>{cmd}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-400 font-medium mb-2">3. Expected Output</h4>
                    <div className="bg-gray-950 p-3 rounded border border-gray-800 text-gray-300">
                      {codeOutput.runGuide.expectedOutput}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {mode === 'evaluate' && evaluation && (
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Quality Score */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Code Quality Score</h3>
                  <span className={`text-4xl font-bold ${getQualityColor(evaluation.quality_score)}`}>
                    {evaluation.quality_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      evaluation.quality_score >= 75 ? 'bg-green-500' :
                      evaluation.quality_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${evaluation.quality_score}%` }}
                  />
                </div>
                <p className="text-gray-400 mt-2 capitalize">Level: {evaluation.quality_level}</p>
              </div>

              {/* Critical Issues */}
              {evaluation.critical_issues.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-semibold text-red-500 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Critical Issues ({evaluation.critical_issues.length})
                  </h3>
                  <div className="space-y-3">
                    {evaluation.critical_issues.map((issue, i) => (
                      <div key={i} className="bg-gray-950 p-3 rounded border border-red-900/50">
                        <div className="flex items-start justify-between mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">Line {issue.line}</span>
                        </div>
                        <p className="text-white text-sm mb-1">{issue.description}</p>
                        <p className="text-green-400 text-xs">Fix: {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {evaluation.warnings.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-semibold text-yellow-500 mb-3">
                    Warnings ({evaluation.warnings.length})
                  </h3>
                  <div className="space-y-2">
                    {evaluation.warnings.slice(0, 5).map((warning, i) => (
                      <div key={i} className="bg-gray-950 p-2 rounded border border-yellow-900/50 text-sm">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-gray-300">{warning.description}</span>
                          <span className="text-xs text-gray-500">Line {warning.line}</span>
                        </div>
                        <p className="text-yellow-400 text-xs">{warning.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {evaluation.best_practices_followed.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-semibold text-green-500 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Best Practices Followed ({evaluation.best_practices_followed.length})
                  </h3>
                  <ul className="space-y-1">
                    {evaluation.best_practices_followed.slice(0, 5).map((practice, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {evaluation.improvements.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-semibold text-blue-500 mb-3">
                    Improvement Recommendations
                  </h3>
                  <div className="space-y-3">
                    {evaluation.improvements.slice(0, 5).map((imp, i) => (
                      <div key={i} className="bg-gray-950 p-3 rounded border border-blue-900/50">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-white font-medium">{imp.issue}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            imp.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                            imp.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-blue-900/50 text-blue-300'
                          }`}>
                            {imp.priority}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Line {imp.line}</p>
                        <p className="text-green-400 text-sm">{imp.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refactored Code */}
              {evaluation.refactored_code && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Improved Version</h3>
                    <button
                      onClick={() => copyToClipboard(evaluation.refactored_code!)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="bg-gray-950 p-4 rounded border border-gray-800 overflow-auto max-h-96 text-sm font-mono text-gray-300">
                    <code>{evaluation.refactored_code}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {!codeOutput && !evaluation && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {mode === 'generate' 
                    ? 'Enter a description to generate code' 
                    : 'Paste code to analyze quality'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeGen;