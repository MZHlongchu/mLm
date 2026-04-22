# InferrLM Agent Guide

## Build Commands
```bash
npx expo start           # Start Metro bundler
npx expo run:android   # Build and run on Android device
npx expo run:ios      # Build and run on iOS simulator
yarn install          # Install dependencies
```

## Tech Stack
- React Native 0.81.5 + Expo 54
- TypeScript/JavaScript
- Local LLM inference via llama.cpp (GGUF models)
- Built-in TCP HTTP server (port 8889)
- iOS MLX inference via @inferrlm/react-native-mlx

## Project Structure
```
src/
├── services/
│   ├── TCPServer.ts          # HTTP server entry point
│   ├── tcp/http/
│   │   ├── httpParser.ts   # HTTP request parsing (Buffer-based)
│   │   ├── chatHandlers.ts
│   │   └── openaiHandler.ts
│   ├── tools/              # Tool registry (remote models only)
│   └── inference-engine-service.ts
```

## Critical: TCP/HTTP Parsing

**ALWAYS use Buffer for TCP data, not strings.**

HTTP Content-Length is in **bytes**, but JavaScript strings use character count. This causes Chinese/non-ASCII characters to fail.

Wrong (bug):
```typescript
const text = chunk.toString('utf8');
const buffer = state.buffer + text;  // character count, wrong!
if (buffer.length < contentLength)  // wrong comparison
```

Correct:
```typescript
import { Buffer } from 'buffer';
const newBuffer = Buffer.concat([state.buffer, chunk]);  // bytes
if (newBuffer.length < totalBytes)  // byte comparison
```

Files needing this fix: `TCPServer.ts`, `httpParser.ts`.

## Testing HTTP API

Python socket test (accurate Content-Length):
```python
import json, socket
body = json.dumps({'model': 'modelname', ...})
req = f'POST /v1/chat/completions HTTP/1.1\r\nHost: 192.168.x.x\r\nContent-Type: application/json\r\nContent-Length: {len(body)}\r\n\r\n'.encode() + body.encode()
s = socket.socket(); s.connect(('192.168.x.x', 8889)); s.sendall(req)
```

The `curl` command can miscalculate Content-Length for non-ASCII content.

## Local Models vs Remote Models
- Local GGUF: Only text completion, no tool calling
- Remote (OpenAI/Gemini/Claude): Full tool calling support via ToolRegistry

## App Entry Point
```
index.tsx → App.tsx → expo-router tabs → src/app/*
```