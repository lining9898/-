import { describe, expect, it, vi } from 'vitest';
import { mirrorToGitee, type GitResult } from '../../.github/scripts/mirror-to-gitee.mjs';

const target = 'a'.repeat(40);
const previous = 'b'.repeat(40);
const ok = (stdout = ''): GitResult => ({ status: 0, stdout });
const branch = (sha: string) => ok(`${sha}\trefs/heads/master\n`);
const failure = (stderr: string): GitResult => ({ status: 1, stderr });
const queuedGit = (...responses: GitResult[]) => vi.fn((_args: string[]) => {
  const response = responses.shift();
  if (!response) throw new Error('Unexpected Git invocation');
  return response;
});

describe('Gitee mirror confirmation and retries', () => {
  it('confirms the remote commit after pushing the expected source commit', async () => {
    const runGit = queuedGit(ok(target), branch(previous), ok(), branch(target));
    await expect(mirrorToGitee({ runGit, log: vi.fn() })).resolves.toBe(target);
    expect(runGit.mock.calls.find(([args]) => args[0] === 'push')?.[0]).toEqual([
      'push', '--porcelain', 'https://gitee.com/lining9/cn-structural-toolkit.git',
      `${target}:refs/heads/master`,
    ]);
  });

  it('retries a TLS interruption and waits between attempts', async () => {
    const runGit = queuedGit(ok(target), branch(previous),
      failure('RPC failed; curl 65 GnuTLS recv error (-110)'), branch(previous),
      branch(previous), ok(), branch(target));
    const pause = vi.fn(async () => undefined);
    await expect(mirrorToGitee({ runGit, pause, log: vi.fn() })).resolves.toBe(target);
    expect(pause).toHaveBeenCalledWith(5000);
    expect(runGit.mock.calls.filter(([args]) => args[0] === 'push')).toHaveLength(2);
  });

  it('does not accept a successful process exit when the remote commit is still old', async () => {
    const runGit = queuedGit(ok(target), branch(previous), ok(), branch(previous),
      branch(previous), ok(), branch(previous));
    await expect(mirrorToGitee({ runGit, attempts: 2,
      pause: async () => undefined, log: vi.fn() })).rejects.toThrow('after 2 attempts');
  });

  it('accepts a lost acknowledgement only when the remote branch confirms the commit', async () => {
    const runGit = queuedGit(ok(target), branch(previous),
      failure('fatal: the remote end hung up unexpectedly'), branch(target));
    const pause = vi.fn(async () => undefined);
    await expect(mirrorToGitee({ runGit, pause, log: vi.fn() })).resolves.toBe(target);
    expect(pause).not.toHaveBeenCalled();
  });

  it.each(['Authentication failed', '[rejected] master -> master (non-fast-forward)'])(
    'stops on rejection without a forced push: %s', async message => {
      const runGit = queuedGit(ok(target), branch(previous), failure(message), branch(previous));
      const pause = vi.fn(async () => undefined);
      await expect(mirrorToGitee({ runGit, pause, log: vi.fn() })).rejects.toThrow('Gitee rejected');
      expect(pause).not.toHaveBeenCalled();
      expect(runGit.mock.calls.some(([args]) => args.includes('--force'))).toBe(false);
    });

  it('skips an upload when the branch already matches', async () => {
    const runGit = queuedGit(ok(target), branch(target));
    await expect(mirrorToGitee({ runGit, log: vi.fn() })).resolves.toBe(target);
    expect(runGit.mock.calls.some(([args]) => args[0] === 'push')).toBe(false);
  });
});
