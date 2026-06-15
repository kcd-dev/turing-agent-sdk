// Turing Agent SDK 发布包入口。
// 设计目标：在 API 形态上对齐 @anthropic-ai/claude-agent-sdk，默认把 agent runtime 指向 turing。
// 请勿在此文件中写入任何 API key / token / 私有配置。
import * as ClaudeAgentSdk from '@anthropic-ai/claude-agent-sdk';

export * from '@anthropic-ai/claude-agent-sdk';

export const TURING_AGENT_SDK_VERSION = '1.1.7';

function resolveTuringExecutable(options = {}) {
  if (typeof options.pathToTuringExecutable === 'string' && options.pathToTuringExecutable.trim()) {
    return options.pathToTuringExecutable;
  }
  if (typeof options.pathToClaudeCodeExecutable === 'string' && options.pathToClaudeCodeExecutable.trim()) {
    return options.pathToClaudeCodeExecutable;
  }
  if (typeof process.env.TURING_BINARY_PATH === 'string' && process.env.TURING_BINARY_PATH.trim()) {
    return process.env.TURING_BINARY_PATH;
  }
  return 'turing';
}

function withTuringDefaults(options = {}) {
  const { pathToTuringExecutable, env, ...rest } = options;

  return {
    ...rest,
    pathToClaudeCodeExecutable: resolveTuringExecutable(options),
    env: {
      ...process.env,
      TURING_AGENT_SDK_VERSION,
      TURING_CODE_ENTRYPOINT: 'agent-sdk',
      ...(env || {}),
    },
  };
}

export function query(params) {
  return ClaudeAgentSdk.query({
    ...params,
    options: withTuringDefaults(params?.options || {}),
  });
}

export const tool = ClaudeAgentSdk.tool;
export const createSdkMcpServer = ClaudeAgentSdk.createSdkMcpServer;
