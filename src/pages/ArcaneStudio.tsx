import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Connection, Edge, Node, ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Puzzle, Save, Play, FolderOpen, Trash2, CheckCircle, AlertCircle, Loader, Clock
} from 'lucide-react';

import ScheduleModal from '../components/studio/ScheduleModal';
import { nodeTypes } from '../components/studio/StudioNodes';
import BlockPalette from '../components/studio/BlockPalette';
import SavedPipelinesModal from '../components/studio/SavedPipelinesModal';
import studioService from '../services/studioService';

// ─── Default config per block type ────────────────────
const DEFAULT_DATA: Record<string, Record<string, any>> = {
  inputText: { text: '' },
  inputPdf: { fileName: '', text: '' },
  inputExcel: { fileName: '', text: '' },
  planner: { prompt: '', systemPrompt: '' },
  analyst: { prompt: '', focus: '', systemPrompt: '' },
  memory: { prompt: '', query: '', systemPrompt: '' },
  reasoner: { prompt: '', constraints: '', systemPrompt: '' },
  coder: { prompt: '', language: '' },
  execution: { code: '', language: 'python' },
  transform: { transform: 'Pass-through', regex: '' },
  outputText: { result: '' },
  outputPdf: { result: '' },
  outputExcel: { result: '' },
  vision: { prompt: '', fileName: '', file: null },
  search: { prompt: '', result: '' },
  sqlAgent: { prompt: '', connection: '', result: '' },
  chameleon: { prompt: '', persona: '', result: '' },
  oracle: { prompt: '', result: '' },
  alchemist: { prompt: '', format: '', result: '' },
  sentinel: { prompt: '', rules: '', result: '' },
  chronicler: { prompt: '', namespace: '', result: '' },
  validator: { validationType: 'JSON Schema', rules: '', result: '' },
  branch: { condition: '', result: '' },
};

// ─── Topological sort ─────────────────────────────────
function topoSort(nodes: Node[], edges: Edge[]): Node[] {
  const adj: Record<string, string[]> = {};
  const inDeg: Record<string, number> = {};
  nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
  edges.forEach(e => {
    adj[e.source].push(e.target);
    inDeg[e.target] = (inDeg[e.target] || 0) + 1;
  });
  const queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  const result: Node[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    result.push(nodes.find(n => n.id === id)!);
    adj[id].forEach(next => {
      inDeg[next]--;
      if (inDeg[next] === 0) queue.push(next);
    });
  }
  return result;
}

// ─── Get upstream output text ─────────────────────────
function getInput(nodeId: string, edges: Edge[], nodeDataMap: Record<string, any>): string {
  const incoming = edges.filter(e => e.target === nodeId);
  return incoming.map(e => nodeDataMap[e.source]?.result || '').filter(Boolean).join('\n\n');
}

let nodeIdCounter = 0;


export default function ArcaneStudio() {
  const { playSound } = useAudio();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [showPipelinesModal, setShowPipelinesModal] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'running' | 'success' | 'error'; msg: string }>
    ({ type: 'idle', msg: '' });
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // ─── Shared node field updater ──────────────────────
  const makeOnChange = useCallback((nodeId: string) => (field: string, value: any) => {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n
    ));
  }, [setNodes]);


  const injectHandlers = useCallback((n: Node): Node => ({
    ...n,
    data: {
      ...n.data,
      onChange: makeOnChange(n.id),
      onDelete: () => {
        setNodes(ns => ns.filter(node => node.id !== n.id));
        setEdges(es => es.filter(e => e.source !== n.id && e.target !== n.id));
      },
      onCopy: () => {
        setNodes(ns => {
          const original = ns.find(node => node.id === n.id);
          if (!original) return ns;
          const newId = `${original.type}-${++nodeIdCounter}`;
          const newNode = injectHandlers({
            ...original,
            id: newId,
            position: { x: original.position.x + 40, y: original.position.y + 40 },
            data: {
              ...original.data,
              result: '',
              error: '',
              running: false,
            }
          });
          return [...ns, newNode];
        });
      },
    },
  }), [makeOnChange, setNodes, setEdges]);

  // ─── Add node callback + inject handlers ───────────
  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const id = `${type}-${++nodeIdCounter}`;
    const newNode = injectHandlers({
      id,
      type,
      position,
      data: { ...DEFAULT_DATA[type] },
    });
    setNodes(ns => [...ns, newNode]);
  }, [setNodes, injectHandlers]);

  // Inject handlers into existing nodes (e.g. from props or initial state)
  useEffect(() => {
    setNodes(ns => ns.map(injectHandlers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Drag & Drop ────────────────────────────────────
  const onDragStart = (event: React.DragEvent, blockType: string) => {
    event.dataTransfer.setData('application/studio-block', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/studio-block');
    if (!type || !rfInstance || !reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    addNode(type, position);
  }, [rfInstance, addNode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect = useCallback((params: Connection) =>
    setEdges(es => addEdge({ ...params, animated: true }, es) as Edge[]),
    [setEdges]);

  // ─── Run Pipeline ────────────────────────────────────
  const runPipeline = useCallback(async () => {
    if (nodes.length === 0) return;
    playSound('START');
    setStatus({ type: 'running', msg: 'Running pipeline…' });

    // Mark all nodes as running
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, running: true, result: '', error: '' } })));

    const ordered = topoSort(nodes, edges);
    const resultMap: Record<string, any> = {};

    for (const node of ordered) {
      const d = node.data as any;
      const upstream = getInput(node.id, edges, resultMap);

      let result = '';
      let error = '';

      try {
        // Mark current as running, others as idle
        setNodes(ns => ns.map(n => ({
          ...n,
          data: { ...n.data, running: n.id === node.id, onChange: makeOnChange(n.id) },
        })));

        if (node.type === 'inputText') {
          result = d.text || '';
        } else if (node.type === 'inputPdf') {
          if (d.file) {
            const r = await studioService.extractPdf(d.file);
            result = r.full_text || r.content || r.text || r.summary || JSON.stringify(r);
          } else {
            result = d.text || '';
          }
        } else if (node.type === 'inputExcel') {
          result = d.text || upstream;
        } else if (['planner', 'executor', 'analyst', 'memory', 'tool', 'reasoner', 'chameleon', 'oracle', 'alchemist', 'sentinel'].includes(node.type!)) {
          const prompt = d.prompt
            ? (upstream ? `${d.prompt}\n\nContext:\n${upstream}` : d.prompt)
            : upstream;

          // SPECIALIZED AGENT PERSONAS (Phase 2.1)
          let systemPrompt = d.systemPrompt || undefined;
          if (node.type === 'chameleon' && d.persona) {
            systemPrompt = `You are ${d.persona}. Adopt this role completely. Task: ${systemPrompt || 'Execute the following user request.'}`;
          } else if (node.type === 'oracle') {
            systemPrompt = `You are The Oracle, a data forecaster. Analyze the data and predict future trends. ${systemPrompt || ''}`;
          } else if (node.type === 'alchemist' && d.format) {
            systemPrompt = `You are The Alchemist. Convert the following input strictly to ${d.format} format. ${systemPrompt || ''}`;
          } else if (node.type === 'sentinel' && d.rules) {
            systemPrompt = `You are The Sentinel, a security auditor. Audit the following content against these rules: ${d.rules}. ${systemPrompt || ''}`;
          }

          const r = await studioService.executeAgent({
            agent_type: node.type === 'chameleon' || node.type === 'oracle' || node.type === 'alchemist' || node.type === 'sentinel' || node.type === 'chronicler' ? 'executor' : node.type!,
            prompt,
            system_prompt: systemPrompt,
          });
          result = r.result;
          if (!r.success) error = r.error || 'Agent error';
        } else if (node.type === 'vision') {
          if (!d.file) {
            error = "No image uploaded";
          } else {
            const r = await studioService.executeVision(d.prompt || 'Describe this image', d.file);
            result = r.result;
            if (!r.success) error = r.error || 'Vision error';
          }
        } else if (node.type === 'search') {
          const query = d.prompt || upstream;
          const r = await studioService.executeSearch(query);
          result = r.result;
          if (!r.success) error = r.error || 'Search error';
        } else if (node.type === 'sqlAgent') {
          const query = d.prompt || upstream;
          const r = await studioService.executeSql(query);
          result = r.result;
          if (!r.success) error = r.error || 'SQL error';
        } else if (node.type === 'chronicler') {
          const r = await studioService.executeRag(d.prompt || upstream, d.namespace);
          result = r.result;
          if (!r.success) error = r.error || 'RAG error';
        } else if (node.type === 'validator') {
          const rules = d.rules || '';
          if (d.validationType === 'JSON Schema') {
            try { JSON.parse(upstream); result = "✓ Valid JSON"; }
            catch { result = "✗ Invalid JSON"; error = "Parse error"; }
          } else if (d.validationType === 'Regex' && rules) {
            const regex = new RegExp(rules.replace(/^\/|\/[gimsuy]*$/g, ''));
            result = regex.test(upstream) ? "✓ Matches Regex" : "✗ No match";
          } else {
            result = `✓ Content length: ${upstream.length}`;
          }
        } else if (node.type === 'branch') {
          const condition = d.condition || 'true';
          try {
            // Simple JS sandbox for condition
            const func = new Function('input', `return ${condition}`);
            const bool = func(upstream);
            result = bool ? "TRUE" : "FALSE";
          } catch (err: any) {
            result = "ERROR";
            error = `Condition error: ${err.message}`;
          }
        } else if (node.type === 'coder') {
          const prompt = d.prompt
            ? (upstream ? `${d.prompt}\n\nInput Data:\n${upstream}` : d.prompt)
            : upstream;
          const r = await studioService.generateCode(prompt);
          result = r.files?.map((f: any) => {
            const comment = (f.language === 'python' || f.filename?.endsWith('.py')) ? '#' : '//';
            return `${comment} FILE: ${f.filename}\n${f.content}`;
          }).join('\n\n') || upstream;
        } else if (node.type === 'execution') {
          const code = d.code || upstream;
          if (!code || !code.trim()) {
            error = 'No code provided to execute';
            result = '';
          } else {
            const r = await studioService.executeCode(code, d.language || 'python');
            // Store what was actually executed for UI visibility
            d.executedCode = code;

            if (r.success) {
              result = r.output || (r.success ? '(No output)' : '');
              error = '';
            } else {
              error = r.error || r.output || 'Execution error';
              result = '';
            }
          }
        } else if (node.type === 'transform') {
          const input = upstream;
          switch (d.transform) {
            case 'Trim whitespace': result = input.trim(); break;
            case 'Uppercase': result = input.toUpperCase(); break;
            case 'Lowercase': result = input.toLowerCase(); break;
            case 'JSON parse':
              try { result = JSON.stringify(JSON.parse(input), null, 2); }
              catch { result = input; error = 'Invalid JSON'; }
              break;
            case 'Extract first line': result = input.split('\n')[0]; break;
            default: result = input;
          }
          if (d.regex) {
            try { result = result.replace(new RegExp(d.regex.replace(/^\/|\/[gimsuy]*$/g, ''), 'g'), ''); }
            catch { error = 'Invalid regex'; }
          }
        } else if (node.type?.startsWith('output')) {
          result = upstream;
        }
      } catch (err: any) {
        error = err?.response?.data?.detail || err.message || 'Unknown error';
        playSound('ERROR');
      }

      resultMap[node.id] = { result, error };

      // Update the specific node that just finished
      setNodes(ns => ns.map(n =>
        n.id === node.id
          ? {
            ...n,
            data: {
              ...n.data,
              result,
              error,
              executedCode: d.executedCode, // Explicitly persist the code we just ran
              running: false
            }
          }
          : n
      ));
    }

    playSound('SUCCESS');
    setStatus({ type: 'success', msg: 'Pipeline complete ✓' });
    setTimeout(() => setStatus({ type: 'idle', msg: '' }), 4000);
  }, [nodes, edges, setNodes, makeOnChange, playSound]);

  // ─── Save pipeline ────────────────────────────────────
  const savePipeline = async () => {
    setSaving(true);
    try {
      const nodeConfigs: Record<string, any> = {};
      nodes.forEach(n => {
        const { onChange, onExportPdf, onExportCsv, running, result, error, file, ...rest } = n.data as any;
        nodeConfigs[n.id] = rest;
      });
      const cleanNodes = nodes.map(n => {
        const { onChange, onExportPdf, onExportCsv, running, file, ...rest } = n.data as any;
        return { ...n, data: rest };
      });
      const payload = {
        name: pipelineName,
        nodes: cleanNodes,
        edges,
        nodeConfigs,
        schedule,
      };

      // If it's a template (tpl-...), we save it as a NEW pipeline for the user
      if (currentPipelineId && !currentPipelineId.startsWith('tpl-')) {
        await studioService.updatePipeline(currentPipelineId, payload);
        setStatus({ type: 'success', msg: 'Pipeline updated!' });
      } else {
        const saved = await studioService.savePipeline(payload);
        setCurrentPipelineId(saved.id);
        setStatus({ type: 'success', msg: 'Pipeline saved as new!' });
      }
      setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Save failed: ' + (err.message || 'error') });
    } finally {
      setSaving(false);
    }
  };

  // ─── Load pipeline ─────────────────────────────────────
  const loadPipeline = async (id: string) => {
    try {
      const p = await studioService.getPipeline(id);
      setPipelineName(p.name);
      setCurrentPipelineId(p.id);
      setSchedule(p.schedule);
      const loadedNodes = p.nodes.map(injectHandlers);
      setNodes(loadedNodes);
      setEdges(p.edges);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setPipelineName('Untitled Pipeline');
    setCurrentPipelineId(null);
    setSchedule(null);
    setStatus({ type: 'idle', msg: '' });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      loadPipeline(id);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#020409] overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────── */}
      <div className="flex-shrink-0 h-14 flex items-center gap-3 px-4 border-b border-white/5 bg-black/60 backdrop-blur-md z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="p-1.5 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <Puzzle size={14} className="text-pink-400" />
          </div>
          <span className="text-[11px] font-black tracking-[0.2em] text-white/80 uppercase">Studio</span>
        </div>

        {/* Pipeline name */}
        <input
          value={pipelineName}
          onChange={e => setPipelineName(e.target.value)}
          className="
            bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
            text-xs text-white/70 font-mono w-44
            focus:outline-none focus:border-pink-500/40
          "
        />

        <div className="flex-1" />

        {/* Status badge */}
        {status.type !== 'idle' && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold
            ${status.type === 'running' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : ''}
            ${status.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : ''}
            ${status.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : ''}
          `}>
            {status.type === 'running' && <Loader size={10} className="animate-spin" />}
            {status.type === 'success' && <CheckCircle size={10} />}
            {status.type === 'error' && <AlertCircle size={10} />}
            {status.msg}
          </div>
        )}

        {/* Actions */}
        <button
          onClick={() => setShowPipelinesModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
        >
          <FolderOpen size={12} /> Load
        </button>
        <button
          onClick={() => setShowScheduleModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${schedule?.active ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'}`}
        >
          <Clock size={12} /> {schedule?.active ? 'Scheduled' : 'Schedule'}
        </button>
        <button
          onClick={savePipeline}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-40"
        >
          {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Save
        </button>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={12} /> Clear
        </button>
        <button
          onClick={runPipeline}
          disabled={status.type === 'running' || nodes.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-[10px] font-bold text-pink-300 hover:bg-pink-500/30 transition-all disabled:opacity-40"
        >
          {status.type === 'running'
            ? <><Loader size={12} className="animate-spin" /> Running…</>
            : <><Play size={12} /> Run Pipeline</>
          }
        </button>
      </div>

      {/* ── Main Area ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        <BlockPalette onDragStart={onDragStart} />

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Delete', 'Backspace']}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="rgba(240,20,124,0.07)"
            />
            <Controls className="!bg-black/60 !border-white/10 !rounded-xl" />
            <MiniMap
              className="!bg-black/60 !border !border-white/10 !rounded-xl"
              nodeColor={n => {
                const t = n.type || '';
                if (t.startsWith('input')) return '#3b82f6';
                if (t.startsWith('output')) return '#22c55e';
                if (['planner', 'executor', 'analyst', 'memory', 'tool', 'reasoner', 'coder'].includes(t)) return '#a855f7';
                return '#f97316';
              }}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>

          {/* Empty state overlay */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-3 opacity-30">
                <Puzzle size={40} className="text-pink-400" />
                <p className="text-white text-sm font-bold tracking-wide">Drag blocks from the left panel</p>
                <p className="text-white/50 text-xs">Connect them to build your pipeline</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Pipelines Modal */}
      {showPipelinesModal && (
        <SavedPipelinesModal
          onLoad={loadPipeline}
          onClose={() => setShowPipelinesModal(false)}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(data) => {
          setSchedule(data);
          // If we already have a user pipeline ID (not a template), trigger an auto-save to persist the schedule
          if (currentPipelineId && !currentPipelineId.startsWith('tpl-')) {
            // We use a small timeout to let the setSchedule state update or just pass data directly
            const nodeConfigs: Record<string, any> = {};
            nodes.forEach(n => {
              const { onChange, onExportPdf, onExportCsv, running, result, error, file, ...rest } = n.data as any;
              nodeConfigs[n.id] = rest;
            });
            const cleanNodes = nodes.map(n => {
              const { onChange, onExportPdf, onExportCsv, running, file, ...rest } = n.data as any;
              return { ...n, data: rest };
            });
            
            studioService.updatePipeline(currentPipelineId, {
              name: pipelineName,
              nodes: cleanNodes,
              edges,
              nodeConfigs,
              schedule: data, // Use the new schedule data directly
            }).then(() => {
              setStatus({ type: 'success', msg: 'Schedule persisted!' });
            }).catch(err => {
              setStatus({ type: 'error', msg: 'Sync failed: ' + (err.message || 'error') });
            });
          } else {
            setStatus({ type: 'success', msg: 'Schedule updated!' });
          }
          setTimeout(() => setStatus({ type: 'idle', msg: '' }), 2000);
        }}
        initialSchedule={schedule}
      />
    </div>
  );
}
