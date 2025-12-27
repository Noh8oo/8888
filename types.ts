
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

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

export type ToolMode = 'analyze' | 'remix' | null;

export interface AppState {
  currentStep: 'upload' | 'style-selection' | 'analyzing' | 'processing' | 'results';
  toolMode: ToolMode;
  image: string | null;
  analysis: ImageAnalysis | null;
}
