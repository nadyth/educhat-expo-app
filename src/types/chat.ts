export interface SourcePage {
  page_number: number;
  page_label: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  isUser: boolean;
  /** Current step label shown while streaming (e.g. "Searching in book...") */
  stepLabel?: string;
  /** Source pages returned by the explain endpoint */
  sources?: SourcePage[];
  /** Name of the file this message relates to */
  fileName?: string;
}

export interface ChatStats {
  totalMessages: number;
  totalTokens: number;
}