
export interface MockupTask {
  type: string;
  prompt: string;
}

export interface MockupResult {
  id: number;
  type: 'image' | 'video';
  src: string;
  taskType: string;
}
