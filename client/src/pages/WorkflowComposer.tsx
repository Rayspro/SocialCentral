import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  Upload, 
  Save, 
  Play,
  Plus,
  Settings,
  Image,
  Layers,
  Zap,
  ChevronRight,
  Eye,
  Move,
  Trash2
} from "lucide-react";

// Node types for the workflow composer
const NODE_TYPES = {
  loaders: [
    { id: "checkpoint_loader", name: "Load Checkpoint", type: "CheckpointLoaderSimple", color: "bg-blue-500" },
    { id: "vae_loader", name: "Load VAE", type: "VAELoader", color: "bg-blue-500" },
    { id: "lora_loader", name: "Load LoRA", type: "LoraLoader", color: "bg-blue-500" },
  ],
  conditioning: [
    { id: "clip_text_encode", name: "CLIP Text Encode", type: "CLIPTextEncode", color: "bg-green-500" },
    { id: "conditioning_combine", name: "Conditioning Combine", type: "ConditioningCombine", color: "bg-green-500" },
    { id: "conditioning_concat", name: "Conditioning Concat", type: "ConditioningConcat", color: "bg-green-500" },
  ],
  sampling: [
    { id: "ksampler", name: "KSampler", type: "KSampler", color: "bg-purple-500" },
    { id: "ksampler_advanced", name: "KSampler Advanced", type: "KSamplerAdvanced", color: "bg-purple-500" },
    { id: "scheduler", name: "Scheduler", type: "KarrasScheduler", color: "bg-purple-500" },
  ],
  latent: [
    { id: "empty_latent", name: "Empty Latent Image", type: "EmptyLatentImage", color: "bg-orange-500" },
    { id: "latent_upscale", name: "Latent Upscale", type: "LatentUpscale", color: "bg-orange-500" },
    { id: "latent_blend", name: "Latent Blend", type: "LatentBlend", color: "bg-orange-500" },
  ],
  vae: [
    { id: "vae_decode", name: "VAE Decode", type: "VAEDecode", color: "bg-red-500" },
    { id: "vae_encode", name: "VAE Encode", type: "VAEEncode", color: "bg-red-500" },
  ],
  image: [
    { id: "save_image", name: "Save Image", type: "SaveImage", color: "bg-pink-500" },
    { id: "load_image", name: "Load Image", type: "LoadImage", color: "bg-pink-500" },
    { id: "image_scale", name: "Image Scale", type: "ImageScale", color: "bg-pink-500" },
  ]
};

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  inputs: { [key: string]: any };
  outputs: { [key: string]: any };
  color: string;
}

interface Connection {
  id: string;
  from: { nodeId: string; output: string };
  to: { nodeId: string; input: string };
}

export default function WorkflowComposer() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle drag start from node library
  const handleDragStart = (e: React.DragEvent, nodeType: any) => {
    setDraggedNode(nodeType);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Handle drop on canvas
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `${draggedNode.id}_${Date.now()}`,
      type: draggedNode.type,
      name: draggedNode.name,
      position: { x, y },
      inputs: {},
      outputs: {},
      color: draggedNode.color
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNode(null);
  }, [draggedNode]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Delete selected node
  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  // Export workflow as JSON
  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      nodes: nodes.reduce((acc, node) => {
        acc[node.id] = {
          class_type: node.type,
          inputs: node.inputs,
          _meta: {
            title: node.name
          }
        };
        return acc;
      }, {} as any),
      connections,
      metadata: {
        created: new Date().toISOString(),
        version: "1.0"
      }
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Home</span>
            <ChevronRight className="h-4 w-4" />
            <span>Workflows</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-gray-100">Composer</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Workflow Composer
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create ComfyUI workflows with drag-and-drop visual editor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-48"
                placeholder="Workflow name"
              />
              <Button onClick={exportWorkflow} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Test
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Node Library */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Node Library
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search nodes..." className="pl-10" />
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <Tabs defaultValue="loaders" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 text-xs">
                    <TabsTrigger value="loaders">Load</TabsTrigger>
                    <TabsTrigger value="conditioning">Cond</TabsTrigger>
                    <TabsTrigger value="sampling">Sample</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(NODE_TYPES).map(([category, nodes]) => (
                    <TabsContent key={category} value={category} className="space-y-2 mt-4">
                      {nodes.map((node) => (
                        <div
                          key={node.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, node)}
                          className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
                            <span className="text-sm font-medium">{node.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{node.type}</span>
                        </div>
                      ))}
                    </TabsContent>
                  ))}

                  <TabsContent value="latent" className="space-y-2 mt-4">
                    {NODE_TYPES.latent.map((node) => (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
                          <span className="text-sm font-medium">{node.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{node.type}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="vae" className="space-y-2 mt-4">
                    {NODE_TYPES.vae.map((node) => (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
                          <span className="text-sm font-medium">{node.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{node.type}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="image" className="space-y-2 mt-4">
                    {NODE_TYPES.image.map((node) => (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
                          <span className="text-sm font-medium">{node.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{node.type}</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Canvas
                  <Badge variant="secondary" className="ml-auto">
                    {nodes.length} nodes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div
                  ref={canvasRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 overflow-auto"
                  style={{
                    backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                >
                  {/* Drop Zone Message */}
                  {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <div className="text-center">
                        <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Drag nodes here to start building</p>
                        <p className="text-sm">Create your ComfyUI workflow visually</p>
                      </div>
                    </div>
                  )}

                  {/* Nodes */}
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute p-4 bg-white dark:bg-slate-800 border-2 rounded-lg shadow-lg cursor-move min-w-[180px] ${
                        selectedNode === node.id 
                          ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-800' 
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                      }}
                      onClick={() => setSelectedNode(node.id)}
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${node.color}`}></div>
                          <span className="text-sm font-medium">{node.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Node Type */}
                      <div className="text-xs text-gray-500 mb-3">{node.type}</div>

                      {/* Input/Output Connections */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-xs">Input</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs">Output</span>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Node ID</label>
                      <Input
                        value={selectedNode}
                        disabled
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={nodes.find(n => n.id === selectedNode)?.name || ""}
                        onChange={(e) => {
                          setNodes(prev => prev.map(n => 
                            n.id === selectedNode 
                              ? { ...n, name: e.target.value }
                              : n
                          ));
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Input
                        value={nodes.find(n => n.id === selectedNode)?.type || ""}
                        disabled
                        className="mt-1"
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Parameters</h4>
                      <p className="text-xs text-gray-500">
                        Node-specific parameters will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a node to view properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}