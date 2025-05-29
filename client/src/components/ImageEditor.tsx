import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface ImageEditorProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: string;
  cropRatio: string;
}

export function ImageEditor({ imageUrl, open, onOpenChange }: ImageEditorProps) {
  const [editSettings, setEditSettings] = useState<EditSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    filter: "original",
    cropRatio: "original",
  });

  const handleSave = () => {
    // In a real implementation, you would apply the edits and save the image
    console.log("Saving edited image with settings:", editSettings);
    onOpenChange(false);
  };

  const applyFilter = (filter: string) => {
    setEditSettings(prev => ({ ...prev, filter }));
  };

  const setCropRatio = (ratio: string) => {
    setEditSettings(prev => ({ ...prev, cropRatio: ratio }));
  };

  const getImageStyle = () => {
    const { brightness, contrast, saturation, filter } = editSettings;
    
    let filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    switch (filter) {
      case "vintage":
        filterStyle += " sepia(0.5) contrast(1.2) brightness(1.1)";
        break;
      case "bw":
        filterStyle += " grayscale(100%)";
        break;
      case "sepia":
        filterStyle += " sepia(100%)";
        break;
    }
    
    return { filter: filterStyle };
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Image Editor</DialogTitle>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-6">
          {/* Editor Tools */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Adjustments</h4>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Brightness: {editSettings.brightness}%
                  </Label>
                  <Slider
                    value={[editSettings.brightness]}
                    onValueChange={([value]) => 
                      setEditSettings(prev => ({ ...prev, brightness: value }))
                    }
                    max={200}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Contrast: {editSettings.contrast}%
                  </Label>
                  <Slider
                    value={[editSettings.contrast]}
                    onValueChange={([value]) => 
                      setEditSettings(prev => ({ ...prev, contrast: value }))
                    }
                    max={200}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Saturation: {editSettings.saturation}%
                  </Label>
                  <Slider
                    value={[editSettings.saturation]}
                    onValueChange={([value]) => 
                      setEditSettings(prev => ({ ...prev, saturation: value }))
                    }
                    max={200}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={editSettings.filter === "original" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("original")}
                  className="text-xs"
                >
                  Original
                </Button>
                <Button
                  variant={editSettings.filter === "vintage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("vintage")}
                  className="text-xs"
                >
                  Vintage
                </Button>
                <Button
                  variant={editSettings.filter === "bw" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("bw")}
                  className="text-xs"
                >
                  B&W
                </Button>
                <Button
                  variant={editSettings.filter === "sepia" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter("sepia")}
                  className="text-xs"
                >
                  Sepia
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Crop</h4>
              <div className="space-y-2">
                <Button
                  variant={editSettings.cropRatio === "1:1" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCropRatio("1:1")}
                  className="w-full text-xs"
                >
                  Square (1:1)
                </Button>
                <Button
                  variant={editSettings.cropRatio === "16:9" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCropRatio("16:9")}
                  className="w-full text-xs"
                >
                  Landscape (16:9)
                </Button>
                <Button
                  variant={editSettings.cropRatio === "9:16" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCropRatio("9:16")}
                  className="w-full text-xs"
                >
                  Portrait (9:16)
                </Button>
              </div>
            </div>
          </div>
          
          {/* Image Canvas */}
          <div className="col-span-3">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 h-96 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Editable content"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={getImageStyle()}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
