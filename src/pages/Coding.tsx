import { useState, useRef, useEffect } from 'react';
import { codingService } from '@/services/codingService';
import {
  Code2,
  Save,
  Download,
  Upload,
  Terminal as TerminalIcon,
  FileCode,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Play,
} from 'lucide-react';

interface GeneratedFile {
  filename: string;
  content: string;
  language: string;
}

interface TerminalOutput {
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

export default function Coding() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [executing, setExecuting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [command, setCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  useEffect(() => {
    if (selectedFile) {
      setEditedContent(selectedFile.content);
    }
  }, [selectedFile]);

  const addTerminalOutput = (type: TerminalOutput['type'], content: string) => {
    setTerminalOutput((prev) => [
      ...prev,
      { type, content, timestamp: new Date() },
    ]);
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    addTerminalOutput('info', '🤖 Generating code...');

    try {
      const result = await codingService.generateCode(prompt);
      setFiles(result.files);
      
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
      }

      addTerminalOutput('info', `✅ Generated ${result.files.length} file(s)`);
      
      if (result.instructions) {
        addTerminalOutput('info', '📝 Instructions:');
        addTerminalOutput('output', result.instructions);
      }
    } catch (error: any) {
      addTerminalOutput('error', `❌ Error: ${error.message || 'Failed to generate code'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;

    const updatedFiles = files.map((f) =>
      f.filename === selectedFile.filename
        ? { ...f, content: editedContent }
        : f
    );
    setFiles(updatedFiles);
    setSelectedFile({ ...selectedFile, content: editedContent });
    addTerminalOutput('info', `💾 Saved ${selectedFile.filename}`);
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;

    const blob = new Blob([editedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename;
    a.click();
    URL.revokeObjectURL(url);
    addTerminalOutput('info', `⬇️ Downloaded ${selectedFile.filename}`);
  };

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newFile: GeneratedFile = {
        filename: file.name,
        content,
        language: getLanguageFromFilename(file.name),
      };
      setFiles([...files, newFile]);
      setSelectedFile(newFile);
      addTerminalOutput('info', `⬆️ Uploaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'text';
  };

  const handleExecuteCode = async () => {
    if (!selectedFile) return;

    setExecuting(true);
    addTerminalOutput('command', `$ Executing ${selectedFile.filename}...`);

    try {
      const result = await codingService.executeCode(
        editedContent,
        selectedFile.language
      );

      if (result.output) {
        addTerminalOutput('output', result.output);
      }

      if (result.error) {
        addTerminalOutput('error', result.error);
      }

      addTerminalOutput('info', result.success ? '✅ Execution completed' : '❌ Execution failed');
    } catch (error: any) {
      addTerminalOutput('error', `❌ Error: ${error.message || 'Execution failed'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleRunCommand = async () => {
    if (!command.trim()) return;

    addTerminalOutput('command', `$ ${command}`);
    const cmd = command;
    setCommand('');

    try {
      const result = await codingService.runCommand(cmd);
      
      if (result.output) {
        addTerminalOutput('output', result.output);
      }
      
      if (result.error) {
        addTerminalOutput('error', result.error);
      }
    } catch (error: any) {
      addTerminalOutput('error', `❌ Error: ${error.message || 'Command failed'}`);
    }
  };

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearTerminal = () => {
    setTerminalOutput([]);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Code Generation</h1>
            <p className="text-gray-400">AI-powered code generation with integrated terminal</p>
          </div>
        </div>

        {/* Code Generation Input */}
        <div className="flex gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want to generate... (e.g., 'Create a Python script that sorts a list', 'Build a React component for a todo list')"
            rows={3}
            disabled={generating}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={handleGenerateCode}
            disabled={!prompt.trim() || generating}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 h-fit"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Code2 className="w-5 h-5" />
                Generate Code
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Files Sidebar */}
        <div className="w-64 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Files</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUploadFile}
              className="hidden"
              accept=".py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.html,.css,.json,.md"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {files.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-4">
                No files yet. Generate or upload code!
              </div>
            ) : (
              files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedFile?.filename === file.filename
                      ? 'bg-gray-800 border-blue-500'
                      : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white truncate">{file.filename}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{file.language}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Code Editor and Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* Code Editor */}
              <div className="flex-1 flex flex-col border-b border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{selectedFile.filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleSaveFile}
                      className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                      title="Save changes"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleExecuteCode}
                      disabled={executing}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="flex-1 p-4 bg-gray-900 text-white font-mono text-sm focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Terminal */}
              <div className="h-80 flex flex-col bg-black">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Terminal</span>
                  </div>
                  <button
                    onClick={handleClearTerminal}
                    className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                    title="Clear terminal"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div
                  ref={terminalRef}
                  className="flex-1 overflow-y-auto p-4 font-mono text-sm"
                >
                  {terminalOutput.length === 0 ? (
                    <div className="text-gray-500">Terminal output will appear here...</div>
                  ) : (
                    terminalOutput.map((output, idx) => (
                      <div
                        key={idx}
                        className={`mb-2 ${
                          output.type === 'command'
                            ? 'text-green-400'
                            : output.type === 'error'
                            ? 'text-red-400'
                            : output.type === 'info'
                            ? 'text-blue-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-600 mr-2">
                          {output.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="whitespace-pre-wrap">{output.content}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">$</span>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRunCommand();
                        }
                      }}
                      placeholder="Enter command..."
                      className="flex-1 bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Code2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No File Selected</h3>
                <p className="text-gray-400">Generate or upload a file to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
