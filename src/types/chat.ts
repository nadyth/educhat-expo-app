export interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  isUser: boolean;
  model?: string;
  thinking?: string;
}

export interface ChatStats {
  totalMessages: number;
  modelsUsed: Set<string>;
  totalTokens: number;
}

export interface ModelOption {
  name: string;
  parameterSize: string;
  family: string;
  quantization: string;
  size: string;
}