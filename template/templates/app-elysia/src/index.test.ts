import { describe, expect, it } from 'vitest';
import { Elysia } from 'elysia';

describe('{{name}} app', () => {
  const app = new Elysia()
    .get('/', () => 'Hello from {{name}}!')
    .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  it('should return hello message on root', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    const text = await response.text();
    expect(text).toBe('Hello from {{name}}!');
  });

  it('should return health status', async () => {
    const response = await app.handle(new Request('http://localhost/health'));
    const json = await response.json();
    expect(json.status).toBe('ok');
    expect(json.timestamp).toBeDefined();
  });
});

