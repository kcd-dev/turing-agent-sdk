export * from '@anthropic-ai/claude-agent-sdk';

import type {
  Options as ClaudeAgentOptions,
  Query,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';

export declare const TURING_AGENT_SDK_VERSION: '1.1.7';

export type TuringAgentOptions = ClaudeAgentOptions & {
  /**
   * Turing Code 可执行文件路径。未传时按顺序使用：
   * 1. options.pathToClaudeCodeExecutable
   * 2. TURING_BINARY_PATH
   * 3. PATH 里的 turing
   */
  pathToTuringExecutable?: string;
};

export declare function query(params: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: TuringAgentOptions;
}): Query;
