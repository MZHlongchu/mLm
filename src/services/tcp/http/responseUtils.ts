import { Buffer } from 'buffer';
import { getHTTPStatusText } from './httpStatus';

function isWritable(socket: any): boolean {
  return socket && !socket.destroyed;
}

export function sendChunkedResponseStart(socket: any, status: number, headers: Record<string, string>): void {
  if (!isWritable(socket)) throw new Error('socket_closed');
  const statusText = getHTTPStatusText(status);
  const mergedHeaders: Record<string, string> = {
    'Transfer-Encoding': 'chunked',
    'Connection': 'close',
    'Access-Control-Allow-Origin': '*',
    ...headers,
  };

  const headerLines = Object.entries(mergedHeaders)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');

  const response = `HTTP/1.1 ${status} ${statusText}\r\n${headerLines}\r\n\r\n`;
  socket.write(response);
}

export function writeChunk(socket: any, payload: any): void {
  if (!isWritable(socket)) throw new Error('socket_closed');
  const body = JSON.stringify(payload) + '\n';
  const size = Buffer.byteLength(body, 'utf8').toString(16);
  const chunk = `${size}\r\n${body}\r\n`;
  socket.write(chunk);
}

export function endChunkedResponse(socket: any): void {
  if (!isWritable(socket)) return;
  socket.write('0\r\n\r\n');
  socket.end();
}

export function sendSSEStart(socket: any, status: number): void {
  if (!isWritable(socket)) throw new Error('socket_closed');
  const statusText = getHTTPStatusText(status);
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  };

  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\r\n');

  const response = `HTTP/1.1 ${status} ${statusText}\r\n${headerLines}\r\n\r\n`;
  socket.write(response);
}

export function writeSSEEvent(socket: any, data: any): void {
  if (!isWritable(socket)) throw new Error('socket_closed');
  const json = JSON.stringify(data);
  socket.write(`data: ${json}\n\n`);
}

export function endSSEStream(socket: any): void {
  if (!isWritable(socket)) return;
  socket.write('data: [DONE]\n\n');
  socket.end();
}
