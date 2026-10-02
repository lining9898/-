import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const HTTP_OPTIONS = [
  '-c', 'http.version=HTTP/1.1',
  // Buffer the request to avoid chunked uploads and allow an interrupted RPC to rewind.
  '-c', 'http.postBuffer=536870912',
  '-c', 'http.lowSpeedLimit=1024',
  '-c', 'http.lowSpeedTime=90',
];

function executeGit(args) {
  return spawnSync('git', [...HTTP_OPTIONS, ...args], {
    encoding: 'utf8',
    timeout: args[0] === 'push' ? 300_000 : 30_000,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

/** A successful upload is accepted only after the remote branch advertises the expected commit. */
export async function mirrorToGitee({
  runGit = executeGit,
  pause = delay,
  log = console.log,
  remote = 'https://gitee.com/lining9/cn-structural-toolkit.git',
  attempts = 3,
} = {}) {
  const head = runGit(['rev-parse', 'HEAD']);
  const target = head.stdout?.trim();
  if (head.status !== 0 || !/^[a-f0-9]{40,64}$/.test(target ?? '')) {
    throw new Error('Cannot resolve the source commit for Gitee mirroring.');
  }
  const remoteHead = () => {
    const result = runGit(['ls-remote', remote, 'refs/heads/master']);
    if (result.status !== 0) return null;
    return result.stdout?.trim().split(/\s+/)[0] || null;
  };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (remoteHead() === target) {
      log(`Gitee master is verified at ${target}.`);
      return target;
    }
    log(`Gitee push attempt ${attempt}/${attempts}: ${target}`);
    const push = runGit(['push', '--porcelain', remote, `${target}:refs/heads/master`]);
    const output = [push.stdout, push.stderr, push.error?.message].filter(Boolean).join('\n');
    if (output) log(output);
    // An acknowledgement can be lost after the server has accepted a push.
    if (remoteHead() === target) {
      log(`Gitee master is verified at ${target}.`);
      return target;
    }
    if (/Authentication failed|could not read Username|Permission denied|non-fast-forward|\[rejected\]|returned error: (401|403)/i.test(output)) {
      throw new Error('Gitee rejected the push. Check credentials or branch divergence; no force push was attempted.');
    }
    if (attempt < attempts) {
      const waitMs = attempt * 5000;
      log(`Remote commit is not confirmed; retrying in ${waitMs / 1000} seconds.`);
      await pause(waitMs);
    }
  }
  throw new Error(`Gitee master did not reach ${target} after ${attempts} attempts.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const target = await mirrorToGitee();
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `Gitee master synchronized and verified at \`${target}\`.\n`);
    }
  } catch (error) {
    console.error(`::error title=Gitee mirror failed::${error.message}`);
    process.exitCode = 1;
  }
}
