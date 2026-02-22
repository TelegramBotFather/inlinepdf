export type ToolStatus = 'ready' | 'coming_soon' | 'blocked_non_local';

export interface ToolDefinition {
  id: string;
  title: string;
  path: `/${string}`;
  description: string;
  status: ToolStatus;
  category: 'organize' | 'convert' | 'secure' | 'optimize' | 'advanced';
  localOnly: true;
}
