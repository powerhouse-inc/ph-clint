export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due: string | null;
  done: boolean;
}
