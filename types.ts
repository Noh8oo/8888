
export interface ImageAnalysis {
  colors: string[];
  style: string;
  layout: string;
  layoutDetail?: string;
  view: string;
  viewDetail?: string;
  objects: string[];
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ToolMode = 'analyze' | 'enhance' | 'transform' | null;

export interface AppState {
  currentStep: 'upload' | 'analyzing' | 'enhancing' | 'transforming' | 'results';
  toolMode: ToolMode;
  image: string | null; // Base64 string
  analysis: ImageAnalysis | null;
}
