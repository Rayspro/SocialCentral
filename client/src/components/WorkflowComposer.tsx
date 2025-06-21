import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Download, Upload, Play, Trash2, Settings, Copy, Link } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NodeType {
  id: string;
  name: string;
  category: string;
  description: string;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
  color: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  inputs: Record<string, any>;
  connections: Array<{
    outputNode: string;
    outputSlot: string;
    inputSlot: string;
  }>;
}

interface Connection {
  id: string;
  fromNode: string;
  fromSlot: string;
  toNode: string;
  toSlot: string;
}

interface WorkflowComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: number;
  onWorkflowSaved?: () => void;
}

const NODE_TYPES: NodeType[] = [
  {
    id: "checkpoint_loader",
    name: "Checkpoint Loader",
    category: "loaders",
    description: "Load checkpoint models",
    inputs: [
      { name: "ckpt_name", type: "string", required: true }
    ],
    outputs: [
      { name: "MODEL", type: "model" },
      { name: "CLIP", type: "clip" },
      { name: "VAE", type: "vae" }
    ],
    color: "#4CAF50"
  },
  {
    id: "clip_text_encode",
    name: "CLIP Text Encode",
    category: "conditioning",
    description: "Encode text prompts",
    inputs: [
      { name: "text", type: "string", required: true },
      { name: "clip", type: "clip", required: true }
    ],
    outputs: [
      { name: "CONDITIONING", type: "conditioning" }
    ],
    color: "#2196F3"
  },
  {
    id: "ksampler",
    name: "KSampler",
    category: "sampling",
    description: "Sample images using K-diffusion",
    inputs: [
      { name: "model", type: "model", required: true },
      { name: "positive", type: "conditioning", required: true },
      { name: "negative", type: "conditioning", required: true },
      { name: "latent_image", type: "latent", required: true },
      { name: "seed", type: "number", required: true, default: 123456 },
      { name: "steps", type: "number", required: true, default: 20 },
      { name: "cfg", type: "number", required: true, default: 7.0 },
      { name: "sampler_name", type: "string", required: true, default: "euler" },
      { name: "scheduler", type: "string", required: true, default: "normal" }
    ],
    outputs: [
      { name: "LATENT", type: "latent" }
    ],
    color: "#FF9800"
  },
  {
    id: "empty_latent_image",
    name: "Empty Latent Image",
    category: "latent",
    description: "Create empty latent image",
    inputs: [
      { name: "width", type: "number", required: true, default: 512 },
      { name: "height", type: "number", required: true, default: 512 },
      { name: "batch_size", type: "number", required: true, default: 1 }
    ],
    outputs: [
      { name: "LATENT", type: "latent" }
    ],
    color: "#9C27B0"
  },
  {
    id: "vae_decode",
    name: "VAE Decode",
    category: "vae",
    description: "Decode latent to image",
    inputs: [
      { name: "samples", type: "latent", required: true },
      { name: "vae", type: "vae", required: true }
    ],
    outputs: [
      { name: "IMAGE", type: "image" }
    ],
    color: "#F44336"
  },
  {
    id: "save_image",
    name: "Save Image",
    category: "image",
    description: "Save generated image",
    inputs: [
      { name: "images", type: "image", required: true },
      { name: "filename_prefix", type: "string", required: false, default: "ComfyUI" }
    ],
    outputs: [],
    color: "#607D8B"
  }
];

const NODE_CATEGORIES = [
  { id: "all", name: "All", color: "#666" },
  { id: "loaders", name: "Loaders", color: "#4CAF50" },
  { id: "conditioning", name: "Conditioning", color: "#2196F3" },
  { id: "sampling", name: "Sampling", color: "#FF9800" },
  { id: "latent", name: "Latent", color: "#9C27B0" },
  { id: "vae", name: "VAE", color: "#F44336" },
  { id: "image", name: "Image", color: "#607D8B" }
];

export function WorkflowComposer({ open, onOpenChange, serverId, onWorkflowSaved }: WorkflowComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [workflowName, setWorkflowName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{
    nodeId: string;
    slotName: string;
    slotType: 'input' | 'output';
  } | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const filteredNodeTypes = selectedCategory === "all" 
    ? NODE_TYPES 
    : NODE_TYPES.filter(node => node.category === selectedCategory);

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      return apiRequest('POST', `/api/comfy/workflows`, workflowData);
    },
    onSuccess: () => {
      toast({
        title: "Workflow Created",
        description: "Your workflow has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/comfy/workflows'] });
      onWorkflowSaved?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, nodeTypeId: string) => {
    setDraggedNodeType(nodeTypeId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    const nodeType = NODE_TYPES.find(nt => nt.id === draggedNodeType);
    if (!nodeType) return;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: draggedNodeType,
      name: nodeType.name,
      position: { x, y },
      inputs: {},
      connections: []
    };

    // Set default values for inputs
    nodeType.inputs.forEach(input => {
      if (input.default !== undefined) {
        newNode.inputs[input.name] = input.default;
      }
    });

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodeInput = (nodeId: string, inputName: string, value: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, inputs: { ...node.inputs, [inputName]: value } }
        : node
    ));
  };

  const startConnection = (nodeId: string, slotName: string, slotType: 'input' | 'output') => {
    setConnecting({ nodeId, slotName, slotType });
  };

  const completeConnection = (nodeId: string, slotName: string, slotType: 'input' | 'output') => {
    if (!connecting) return;

    if (connecting.slotType === slotType || connecting.nodeId === nodeId) {
      setConnecting(null);
      return;
    }

    let fromNode, fromSlot, toNode, toSlot;
    
    if (connecting.slotType === 'output') {
      fromNode = connecting.nodeId;
      fromSlot = connecting.slotName;
      toNode = nodeId;
      toSlot = slotName;
    } else {
      fromNode = nodeId;
      fromSlot = slotName;
      toNode = connecting.nodeId;
      toSlot = connecting.slotName;
    }

    // Remove existing connection to the input slot
    setConnections(prev => prev.filter(c => !(c.toNode === toNode && c.toSlot === toSlot)));

    // Add new connection
    const newConnection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromNode,
      fromSlot,
      toNode,
      toSlot
    };

    setConnections(prev => [...prev, newConnection]);
    setConnecting(null);
  };

  const exportWorkflow = () => {
    const workflowData = {
      nodes: nodes.reduce((acc, node) => {
        const nodeType = NODE_TYPES.find(nt => nt.id === node.type);
        if (!nodeType) return acc;

        acc[node.id] = {
          class_type: node.type,
          inputs: { ...node.inputs },
          _meta: { title: node.name }
        };

        // Add connections as inputs
        connections.forEach(conn => {
          if (conn.toNode === node.id) {
            acc[node.id].inputs[conn.toSlot] = [conn.fromNode, conn.fromSlot];
          }
        });

        return acc;
      }, {} as any)
    };

    return JSON.stringify(workflowData, null, 2);
  };

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    const workflowJson = exportWorkflow();
    
    createWorkflowMutation.mutate({
      name: workflowName,
      serverId,
      workflowJson,
      description: `Custom workflow with ${nodes.length} nodes`,
      category: "custom",
      isTemplate: false
    });
  };

  const clearWorkflow = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
    setConnecting(null);
  };

  const downloadWorkflow = () => {
    const workflowJson = exportWorkflow();
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Workflow Composer
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Node Palette */}
          <div className="w-80 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Workflow Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="workflow-name">Name</Label>
                  <Input
                    id="workflow-name"
                    placeholder="Enter workflow name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveWorkflow}
                    disabled={createWorkflowMutation.isPending}
                    className="flex-1"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button onClick={downloadWorkflow} variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button onClick={clearWorkflow} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Node Library</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {NODE_CATEGORIES.map(category => (
                    <Badge
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      style={{ 
                        backgroundColor: selectedCategory === category.id ? category.color : undefined,
                        borderColor: category.color 
                      }}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-4">
                    {filteredNodeTypes.map(nodeType => (
                      <div
                        key={nodeType.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, nodeType.id)}
                        className="p-3 border rounded-lg cursor-grab hover:shadow-md transition-shadow"
                        style={{ borderColor: nodeType.color }}
                      >
                        <div className="font-medium text-sm">{nodeType.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {nodeType.description}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {nodeType.inputs.length} inputs
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {nodeType.outputs.length} outputs
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-1" />
                Run Workflow
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                Nodes: {nodes.length} | Connections: {connections.length}
              </span>
            </div>
            
            <div
              ref={canvasRef}
              className="flex-1 bg-gray-50 dark:bg-gray-900 relative overflow-hidden"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                setSelectedNode(null);
                setConnecting(null);
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Grid */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #000 1px, transparent 1px),
                      linear-gradient(to bottom, #000 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Connections */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  {connections.map(connection => {
                    const fromNode = nodes.find(n => n.id === connection.fromNode);
                    const toNode = nodes.find(n => n.id === connection.toNode);
                    if (!fromNode || !toNode) return null;

                    const x1 = fromNode.position.x + 200;
                    const y1 = fromNode.position.y + 30;
                    const x2 = toNode.position.x;
                    const y2 = toNode.position.y + 30;

                    return (
                      <line
                        key={connection.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#666"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#666"
                      />
                    </marker>
                  </defs>
                </svg>

                {/* Nodes */}
                {nodes.map(node => {
                  const nodeType = NODE_TYPES.find(nt => nt.id === node.type);
                  if (!nodeType) return null;

                  return (
                    <div
                      key={node.id}
                      className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg min-w-48 ${
                        selectedNode === node.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        borderColor: nodeType.color
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node.id);
                      }}
                    >
                      {/* Header */}
                      <div 
                        className="px-3 py-2 text-white text-sm font-medium rounded-t-md flex items-center justify-between"
                        style={{ backgroundColor: nodeType.color }}
                      >
                        <span>{node.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Body */}
                      <div className="p-3 space-y-2">
                        {/* Inputs */}
                        {nodeType.inputs.map(input => (
                          <div key={input.name} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 border-2 rounded-full cursor-pointer hover:bg-blue-500"
                              style={{ borderColor: nodeType.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (connecting) {
                                  completeConnection(node.id, input.name, 'input');
                                } else {
                                  startConnection(node.id, input.name, 'input');
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label className="text-xs">{input.name}</Label>
                              {input.type === 'string' && (
                                <Input
                                  size="sm"
                                  value={node.inputs[input.name] || ''}
                                  onChange={(e) => updateNodeInput(node.id, input.name, e.target.value)}
                                  placeholder={input.default?.toString() || ''}
                                  className="h-6 text-xs"
                                />
                              )}
                              {input.type === 'number' && (
                                <Input
                                  type="number"
                                  size="sm"
                                  value={node.inputs[input.name] || ''}
                                  onChange={(e) => updateNodeInput(node.id, input.name, parseFloat(e.target.value) || 0)}
                                  placeholder={input.default?.toString() || '0'}
                                  className="h-6 text-xs"
                                />
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Outputs */}
                        {nodeType.outputs.map(output => (
                          <div key={output.name} className="flex items-center justify-end gap-2">
                            <Label className="text-xs">{output.name}</Label>
                            <div
                              className="w-3 h-3 border-2 rounded-full cursor-pointer hover:bg-blue-500"
                              style={{ borderColor: nodeType.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (connecting) {
                                  completeConnection(node.id, output.name, 'output');
                                } else {
                                  startConnection(node.id, output.name, 'output');
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg font-medium mb-2">Start Building Your Workflow</div>
                    <div className="text-sm">
                      Drag nodes from the library to create your ComfyUI workflow
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}