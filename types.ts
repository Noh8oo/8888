
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

// استعادة وضع الريمكس (الاستوديو)
export type ToolMode = 'analyze' | 'remix' | null;

export interface AppState {
  currentStep: 'upload' | 'style-selection' | 'analyzing' | 'processing' | 'results';
  toolMode: ToolMode;
  image: string | null; // Base64 string
  analysis: ImageAnalysis | null;
}

// استعادة تعريف نمط الريمكس
export interface RemixStyle {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
