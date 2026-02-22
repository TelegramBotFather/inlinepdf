export type ToolStatus = 'ready' | 'coming_soon' | 'blocked_non_local';

export type ToolCategory =
  | 'organize'
  | 'convert'
  | 'secure'
  | 'optimize'
  | 'advanced';

export type ToolInputKind =
  | 'pdf'
  | 'jpg'
  | 'png'
  | 'image'
  | 'scanned_pdf'
  | 'folder';

export type ToolOutputKind =
  | 'pdf'
  | 'jpg'
  | 'png'
  | 'text'
  | 'images'
  | 'audio'
  | 'none';

export type ToolComplexity = 'low' | 'medium' | 'high';

export type ToolWorkspaceMode = 'standard' | 'custom';

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  path: `/${string}`;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  localOnly: true;
  inputKinds: readonly ToolInputKind[];
  outputKinds: readonly ToolOutputKind[];
  supportsBatch: boolean;
  estimatedComplexity: ToolComplexity;
  workspaceMode: ToolWorkspaceMode;
}
