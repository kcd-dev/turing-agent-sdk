# turing-agent-sdk

`turing-agent-sdk` 是 Turing Code 的 Agent SDK，API 形态对齐 `@anthropic-ai/claude-agent-sdk`：你可以在 Node.js 程序里启动一个 Turing agent loop，并继续使用 `query()`、`tool()`、`createSdkMcpServer()`、`allowedTools`、`permissionMode`、`mcpServers`、`skills`、`agents` 等 Claude Agent SDK 风格能力。

它和 `turing-sdk` 的区别：

| 包 | 适合什么 | 核心能力 |
|---|---|---|
| `turing-sdk` | 轻量模型调用 | `query` / `stream` / `streamText`，适合直接调 OpenAI-compatible、Grok、DeepSeek、Google 等模型 |
| `turing-agent-sdk` | 完整 agent loop | 文件读写、Bash、MCP、Skill、子 Agent、权限控制、会话流式事件 |

## 安装

```bash
npm install turing-agent-sdk
```

如果你还没有全局 `turing`，先安装 Turing Code：

```bash
curl -fsSL https://turing.tap365.org/v1.1.7/install.sh | bash
```

也可以在 SDK 里显式指定本地二进制：

```ts
options: {
  pathToTuringExecutable: './turing'
}
```

## 30 秒最小示例

```ts
import { query } from 'turing-agent-sdk';

for await (const message of query({
  prompt: '只回复 ok',
  options: {
    cwd: process.cwd(),
    maxTurns: 2,
    permissionMode: 'plan',
    allowedTools: [],
  },
})) {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'text') process.stdout.write(block.text);
    }
  }
}
```

## 自定义 SDK MCP 工具

下面的写法对齐 `@anthropic-ai/claude-agent-sdk` 的 `createSdkMcpServer` / `tool`：

```ts
import { createSdkMcpServer, query, tool } from 'turing-agent-sdk';
import { z } from 'zod';

const add = tool(
  'add',
  '计算两个数字之和',
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  }),
);

const utilities = createSdkMcpServer({
  name: 'utilities',
  version: '1.0.0',
  tools: [add],
});

for await (const message of query({
  prompt: '用 add 工具计算 12 + 30，只回复结果',
  options: {
    cwd: process.cwd(),
    mcpServers: { utilities },
    allowedTools: ['mcp__utilities__add'],
    maxTurns: 3,
  },
})) {
  if (message.type === 'assistant') console.log(message.message.content);
}
```

## 外挂 MCP server

```ts
import { query } from 'turing-agent-sdk';

for await (const message of query({
  prompt: '读取 package.json 并总结项目名',
  options: {
    cwd: process.cwd(),
    mcpServers: {
      filesystem: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
      },
    },
    allowedTools: ['mcp__filesystem__read_file'],
    maxTurns: 3,
  },
})) {
  console.log(message.type, message);
}
```

## Skill 与子 Agent

```ts
import { query } from 'turing-agent-sdk';

for await (const message of query({
  prompt: '用客服 agent 总结这段用户反馈，并给出下一步处理建议',
  options: {
    cwd: process.cwd(),
    settingSources: ['project'],
    skills: ['customer-support'],
    agents: {
      'support-specialist': {
        description: '处理客服分诊、退款解释、升级建议',
        prompt: '你是客服分诊专家，先归类问题，再给出可执行建议。',
        tools: ['Read', 'Grep', 'Glob'],
      },
    },
    agent: 'support-specialist',
    maxTurns: 4,
  },
})) {
  console.log(message.type, message);
}
```

说明：`skills` 是上下文过滤，不是密钥保险箱；不要把 API key、cookie、token 写进 skill 文件。

## 常用 Options

| 字段 | 说明 |
|---|---|
| `cwd` | agent 运行目录 |
| `pathToTuringExecutable` | Turing SDK 扩展字段，指定 `turing` 二进制 |
| `pathToClaudeCodeExecutable` | 兼容 Claude Agent SDK 字段，也可指向 `turing` |
| `allowedTools` / `disallowedTools` | 工具允许 / 禁止列表 |
| `permissionMode` | `default` / `plan` / `acceptEdits` / `dontAsk` / `bypassPermissions` |
| `mcpServers` | 外挂 MCP server 或 `createSdkMcpServer()` 的 in-process server |
| `skills` | 启用指定 skill 或 `'all'` |
| `agents` / `agent` | 定义并选择子 Agent |
| `model` | 传给底层 Turing Code 的模型名 |
| `settingSources` | 控制读取 user/project/local settings |

## 与 Claude Agent SDK 的关系

`turing-agent-sdk` 不是重新发明一套 Agent API，而是复用并对齐 Claude Agent SDK 的稳定接口，同时把默认可执行文件从 `claude` 切到 `turing`：

- `query()`：同名入口，返回 async iterable 事件流
- `tool()`：同名工具定义 helper
- `createSdkMcpServer()`：同名 in-process MCP server helper
- 其他类型与 helper：从 `@anthropic-ai/claude-agent-sdk` 透传导出

因此，很多 Claude Agent SDK 的 TypeScript 示例只需要改 import：

```diff
-import { query } from '@anthropic-ai/claude-agent-sdk'
+import { query } from 'turing-agent-sdk'
```

如果你的机器没有全局 `turing`，再补：

```ts
options: { pathToTuringExecutable: '/path/to/turing' }
```
