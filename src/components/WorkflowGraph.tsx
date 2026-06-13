import { useMemo } from 'react';
import { ReactFlow, Background, BackgroundVariant, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Workflow } from '@/services/workflowService';

const AGENT_COLORS: Record<string, string> = {
  planner: '#60a5fa',
  executor: '#34d399',
  analyst: '#a78bfa',
  memory: '#fbbf24',
  tool: '#f97316',
  reasoner: '#00d4ff',
  coder: '#f472b6',
  default: '#94a3b8'
};

interface WorkflowGraphProps {
  workflow: Workflow;
}

export default function WorkflowGraph({ workflow }: WorkflowGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const createNode = (id: string, label: string, typeStr: string, x: number, y: number) => {
      const color = AGENT_COLORS[typeStr.toLowerCase()] || AGENT_COLORS.default;
      return {
        id,
        position: { x, y },
        data: { 
          label: (
            <div style={{ padding: '8px 12px', background: `rgba(0,0,0,0.8)`, border: `1px solid ${color}`, borderRadius: 8, color: '#fff', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', minWidth: 120, textAlign: 'center' }}>
              <div style={{ color, marginBottom: 4, fontSize: '0.65rem', textTransform: 'uppercase' }}>{typeStr}</div>
              <div style={{ fontWeight: 600 }}>{label}</div>
            </div>
          ) 
        },
        style: { border: 'none', background: 'transparent', padding: 0 }
      };
    };

    if (workflow.workflowType === 'sequential' && workflow.config.steps) {
      workflow.config.steps.forEach((step, i) => {
        const id = `node-${i}`;
        newNodes.push(createNode(id, step.agent, step.agent, 200, i * 100));
        if (i > 0) {
          newEdges.push({
            id: `edge-${i-1}-${i}`,
            source: `node-${i-1}`,
            target: id,
            style: { stroke: 'rgba(0,212,255,0.4)', strokeWidth: 2 },
            animated: true
          });
        }
      });
    } else if (workflow.workflowType === 'parallel' && workflow.config.agents) {
      newNodes.push(createNode('start', 'Start', 'System', 250, 0));
      workflow.config.agents.forEach((agent, i) => {
        const id = `node-agent-${i}`;
        newNodes.push(createNode(id, agent.agent, agent.agent, i * 200 + 50, 100));
        newEdges.push({
          id: `edge-start-${id}`, source: 'start', target: id,
          style: { stroke: 'rgba(139,92,246,0.4)', strokeWidth: 2 }, animated: true
        });
      });
      
      if (workflow.config.combiner) {
        newNodes.push(createNode('combiner', 'Combiner', workflow.config.combiner, 250, 200));
        workflow.config.agents.forEach((_, i) => {
          newEdges.push({
            id: `edge-${i}-combiner`, source: `node-agent-${i}`, target: 'combiner',
            style: { stroke: 'rgba(139,92,246,0.4)', strokeWidth: 2 }, animated: true
          });
        });
      }
    } else if (workflow.workflowType === 'conditional' && workflow.config.branches) {
      newNodes.push(createNode('start', 'Condition', 'System', 200, 0));
      let yOffset = 100;
      Object.entries(workflow.config.branches).forEach(([branchName, steps], bIdx) => {
        const startId = `node-${branchName}-0`;
        newNodes.push(createNode(startId, branchName, steps[0].agent, bIdx * 250 + 50, yOffset));
        newEdges.push({
          id: `edge-start-${startId}`, source: 'start', target: startId, label: branchName,
          style: { stroke: 'rgba(240,20,124,0.4)', strokeWidth: 2 }, animated: true
        });
        
        steps.forEach((step, sIdx) => {
          if (sIdx > 0) {
            const id = `node-${branchName}-${sIdx}`;
            const prevId = `node-${branchName}-${sIdx-1}`;
            newNodes.push(createNode(id, step.agent, step.agent, bIdx * 250 + 50, yOffset + sIdx * 100));
            newEdges.push({
              id: `edge-${prevId}-${id}`, source: prevId, target: id,
              style: { stroke: 'rgba(240,20,124,0.4)', strokeWidth: 2 }, animated: true
            });
          }
        });
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [workflow]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="rgba(255,255,255,0.1)" />
      </ReactFlow>
    </div>
  );
}
