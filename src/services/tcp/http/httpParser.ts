import { Buffer } from 'buffer';
import { logger } from '../../../utils/logger';

export type HTTPHeaders = { [key: string]: string };

export interface ParsedHTTPRequest {
  requestLine: string;
  headers: HTTPHeaders;
  body: string;
}

export function parseHTTPBuffer(buffer: Buffer): {
  request: ParsedHTTPRequest | null;
  remainingBuffer: Buffer;
  needsMoreData: boolean;
} {
  const separator = Buffer.from('\r\n\r\n');
  const separatorIndex = buffer.indexOf(separator);
  
  if (separatorIndex === -1) {
    return { request: null, remainingBuffer: buffer, needsMoreData: true };
  }

  const headerBytes = buffer.slice(0, separatorIndex);
  const headerStr = headerBytes.toString('utf8');
  
  const requestLineEnd = headerStr.indexOf('\r\n');
  const requestLine = requestLineEnd === -1 ? headerStr : headerStr.slice(0, requestLineEnd);
  
  const headersPart = requestLineEnd === -1 ? '' : headerStr.slice(requestLineEnd + 2);
  const headerLines = headersPart.length > 0 ? headersPart.split('\r\n') : [];
  const headers: HTTPHeaders = {};

  for (const headerLine of headerLines) {
    const separatorPos = headerLine.indexOf(':');
    if (separatorPos !== -1) {
      const key = headerLine.slice(0, separatorPos).trim().toLowerCase();
      const value = headerLine.slice(separatorPos + 1).trim();
      headers[key] = value;
    }
  }

  const contentLength = parseInt(headers['content-length'] || '0', 10);
  const headerEndByte = separatorIndex + 4;
  const totalNeeded = headerEndByte + contentLength;

  if (buffer.length < totalNeeded) {
    return { request: null, remainingBuffer: buffer, needsMoreData: true };
  }

  const bodyBuffer = buffer.slice(headerEndByte, headerEndByte + contentLength);
  const body = bodyBuffer.toString('utf8');
  const remainingBuffer = buffer.slice(totalNeeded);

  return {
    request: { requestLine, headers, body },
    remainingBuffer,
    needsMoreData: false
  };
}
