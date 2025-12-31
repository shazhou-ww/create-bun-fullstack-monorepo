import { describe, it, expect } from 'vitest';
import { example } from './index';

describe('example', () => {
  it('should return a greeting', () => {
    expect(example()).toContain('{{name}}');
  });
});

