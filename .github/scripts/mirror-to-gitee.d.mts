export interface GitResult {
  status: number | null;
  stdout?: string;
  stderr?: string;
  error?: Error;
}
export function mirrorToGitee(options?: {
  runGit?: (args: string[]) => GitResult;
  pause?: (milliseconds: number) => Promise<unknown>;
  log?: (message: string) => void;
  remote?: string;
  attempts?: number;
}): Promise<string>;
