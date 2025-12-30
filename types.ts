
import React from 'react';

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

// تغيير اسم الوضع من enhance إلى remix
export type ToolMode = 'analyze' | 'remix' | null;

export interface AppState {
  // إضافة خطوة اختيار النمط
  currentStep: 'upload' | 'style-selection' | 'analyzing' | 'processing' | 'results';
  toolMode: ToolMode;
  image: string | null; // Base64 string
  analysis: ImageAnalysis | null;
}

export interface RemixStyle {
  id: string;
  name: string;
  icon: string | React.ReactNode;
  prompt: string;
  color: string;
}
