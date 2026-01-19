import { describe, it, expect, vi } from 'vitest';
import {
  configsEqual,
  normalizeMessages,
  cloneMessage,
  buildErrorMessage,
  sortCatchNodes,
  getProperty,
  setProperty,
  deleteProperty,
  parseInjectPayload
} from '../src/utils/runtime-utils.js';

describe('configsEqual', () => {
  it('returns false for null/undefined inputs', () => {
    expect(configsEqual(null, {})).toBe(false);
    expect(configsEqual({}, null)).toBe(false);
    expect(configsEqual(undefined, {})).toBe(false);
  });

  it('returns false for different node types', () => {
    const prev = { _node: { type: 'mqtt-broker' }, host: 'localhost' };
    const next = { _node: { type: 'websocket-client' }, host: 'localhost' };
    expect(configsEqual(prev, next)).toBe(false);
  });

  it('returns true for identical configs', () => {
    const prev = { _node: { type: 'mqtt-broker', id: '1' }, host: 'localhost', port: 1883 };
    const next = { _node: { type: 'mqtt-broker', id: '1' }, host: 'localhost', port: 1883 };
    expect(configsEqual(prev, next)).toBe(true);
  });

  it('returns false when config property changes', () => {
    const prev = { _node: { type: 'mqtt-broker' }, host: 'localhost', port: 1883 };
    const next = { _node: { type: 'mqtt-broker' }, host: 'localhost', port: 8883 };
    expect(configsEqual(prev, next)).toBe(false);
  });

  it('ignores _node property differences (like name, position)', () => {
    const prev = { _node: { type: 'mqtt-broker', name: 'Old', x: 0 }, host: 'localhost' };
    const next = { _node: { type: 'mqtt-broker', name: 'New', x: 100 }, host: 'localhost' };
    expect(configsEqual(prev, next)).toBe(true);
  });

  it('handles nested config objects', () => {
    const prev = { _node: { type: 'test' }, options: { a: 1, b: { c: 2 } } };
    const next = { _node: { type: 'test' }, options: { a: 1, b: { c: 2 } } };
    expect(configsEqual(prev, next)).toBe(true);

    const changed = { _node: { type: 'test' }, options: { a: 1, b: { c: 3 } } };
    expect(configsEqual(prev, changed)).toBe(false);
  });
});

describe('normalizeMessages', () => {
  it('returns null for null/undefined input', () => {
    expect(normalizeMessages(null)).toBe(null);
    expect(normalizeMessages(undefined)).toBe(null);
  });

  it('wraps single message in [[msg]]', () => {
    const msg = { payload: 'test' };
    const result = normalizeMessages(msg);
    expect(result).toEqual([[msg]]);
  });

  it('wraps array of messages in [msgs]', () => {
    const msgs = [{ payload: 1 }, { payload: 2 }];
    const result = normalizeMessages(msgs);
    expect(result).toEqual([msgs]);
  });

  it('passes through array of arrays', () => {
    const msgs = [[{ payload: 1 }], [{ payload: 2 }]];
    const result = normalizeMessages(msgs);
    expect(result).toBe(msgs);
  });

  it('handles sparse arrays (null outputs)', () => {
    const msgs = [null, [{ payload: 'second' }]];
    const result = normalizeMessages(msgs);
    expect(result).toBe(msgs);
  });
});

describe('cloneMessage', () => {
  it('creates a deep copy of message', () => {
    const msg = { payload: { nested: { value: 1 } } };
    const clone = cloneMessage(msg);

    expect(clone).toEqual(msg);
    expect(clone).not.toBe(msg);
    expect(clone.payload).not.toBe(msg.payload);
    expect(clone.payload.nested).not.toBe(msg.payload.nested);
  });

  it('handles arrays in message', () => {
    const msg = { payload: [1, 2, { a: 3 }] };
    const clone = cloneMessage(msg);

    expect(clone.payload).toEqual(msg.payload);
    expect(clone.payload).not.toBe(msg.payload);
  });

  it('handles messages with no nested objects', () => {
    const msg = { payload: 'simple', topic: 'test' };
    const clone = cloneMessage(msg);
    expect(clone).toEqual(msg);
  });
});

describe('buildErrorMessage', () => {
  const mockGenerateId = () => 'test-id-123';
  const sourceNode = { id: 'node1', type: 'function', name: 'My Function' };

  it('creates error message with source info', () => {
    const result = buildErrorMessage(sourceNode, 'Something went wrong', null, null, mockGenerateId);

    expect(result._msgid).toBe('test-id-123');
    expect(result.error.message).toBe('Something went wrong');
    expect(result.error.source.id).toBe('node1');
    expect(result.error.source.type).toBe('function');
    expect(result.error.source.name).toBe('My Function');
  });

  it('preserves original message _msgid', () => {
    const originalMsg = { _msgid: 'original-id', payload: 'test' };
    const result = buildErrorMessage(sourceNode, 'Error', originalMsg, null, mockGenerateId);

    expect(result._msgid).toBe('original-id');
  });

  it('copies original message properties', () => {
    const originalMsg = { _msgid: 'id', payload: 'data', topic: 'mytopic', custom: 123 };
    const result = buildErrorMessage(sourceNode, 'Error', originalMsg, null, mockGenerateId);

    expect(result.payload).toBe('data');
    expect(result.topic).toBe('mytopic');
    expect(result.custom).toBe(123);
  });

  it('includes stack trace from Error object', () => {
    const error = new Error('Test error');
    const result = buildErrorMessage(sourceNode, error.message, null, error, mockGenerateId);

    expect(result.error.stack).toBeDefined();
    expect(result.error.stack).toContain('Error: Test error');
  });

  it('uses node type as name if name not set', () => {
    const unnamedNode = { id: 'node2', type: 'debug' };
    const result = buildErrorMessage(unnamedNode, 'Error', null, null, mockGenerateId);

    expect(result.error.source.name).toBe('debug');
  });
});

describe('sortCatchNodes', () => {
  it('puts regular catch nodes before uncaught-only', () => {
    const catchNodes = [
      { id: '1', config: { scope: 'uncaught' } },
      { id: '2', config: { scope: 'all' } },
      { id: '3', config: { scope: 'uncaught' } },
      { id: '4', config: {} }
    ];

    const sorted = sortCatchNodes(catchNodes);

    // First should be non-uncaught
    expect(sorted[0].config.scope).not.toBe('uncaught');
    expect(sorted[1].config?.scope).not.toBe('uncaught');
    // Last should be uncaught
    expect(sorted[2].config.scope).toBe('uncaught');
    expect(sorted[3].config.scope).toBe('uncaught');
  });

  it('handles empty array', () => {
    expect(sortCatchNodes([])).toEqual([]);
  });

  it('does not mutate original array', () => {
    const original = [
      { id: '1', config: { scope: 'uncaught' } },
      { id: '2', config: { scope: 'all' } }
    ];
    const sorted = sortCatchNodes(original);

    expect(original[0].id).toBe('1');
    expect(sorted).not.toBe(original);
  });
});

describe('getProperty', () => {
  const obj = {
    user: {
      name: 'John',
      address: {
        city: 'NYC',
        zip: '10001'
      }
    },
    items: [1, 2, 3]
  };

  it('gets top-level property', () => {
    expect(getProperty(obj, 'user')).toBe(obj.user);
  });

  it('gets nested property', () => {
    expect(getProperty(obj, 'user.name')).toBe('John');
    expect(getProperty(obj, 'user.address.city')).toBe('NYC');
  });

  it('returns undefined for non-existent path', () => {
    expect(getProperty(obj, 'user.email')).toBeUndefined();
    expect(getProperty(obj, 'foo.bar.baz')).toBeUndefined();
  });

  it('returns object itself for empty/null path', () => {
    expect(getProperty(obj, '')).toBe(obj);
    expect(getProperty(obj, null)).toBe(obj);
  });

  it('handles array access', () => {
    expect(getProperty(obj, 'items.0')).toBe(1);
    expect(getProperty(obj, 'items.2')).toBe(3);
  });
});

describe('setProperty', () => {
  it('sets top-level property', () => {
    const obj = {};
    setProperty(obj, 'name', 'John');
    expect(obj.name).toBe('John');
  });

  it('sets nested property, creating intermediates', () => {
    const obj = {};
    setProperty(obj, 'user.address.city', 'NYC');
    expect(obj.user.address.city).toBe('NYC');
  });

  it('overwrites existing property', () => {
    const obj = { user: { name: 'John' } };
    setProperty(obj, 'user.name', 'Jane');
    expect(obj.user.name).toBe('Jane');
  });

  it('does nothing for empty path', () => {
    const obj = { a: 1 };
    setProperty(obj, '', 'value');
    expect(obj).toEqual({ a: 1 });
  });
});

describe('deleteProperty', () => {
  it('deletes top-level property', () => {
    const obj = { name: 'John', age: 30 };
    deleteProperty(obj, 'name');
    expect(obj).toEqual({ age: 30 });
  });

  it('deletes nested property', () => {
    const obj = { user: { name: 'John', age: 30 } };
    deleteProperty(obj, 'user.age');
    expect(obj.user).toEqual({ name: 'John' });
  });

  it('handles non-existent path gracefully', () => {
    const obj = { a: 1 };
    expect(() => deleteProperty(obj, 'b.c.d')).not.toThrow();
    expect(obj).toEqual({ a: 1 });
  });

  it('does nothing for empty path', () => {
    const obj = { a: 1 };
    deleteProperty(obj, '');
    expect(obj).toEqual({ a: 1 });
  });
});

describe('parseInjectPayload', () => {
  it('returns timestamp for date type', () => {
    const before = Date.now();
    const result = parseInjectPayload('date', '');
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it('returns string as-is for str type', () => {
    expect(parseInjectPayload('str', 'hello world')).toBe('hello world');
  });

  it('parses number for num type', () => {
    expect(parseInjectPayload('num', '42')).toBe(42);
    expect(parseInjectPayload('num', '3.14')).toBe(3.14);
    expect(parseInjectPayload('num', 'invalid')).toBe(0);
  });

  it('parses JSON for json type', () => {
    expect(parseInjectPayload('json', '{"a":1}')).toEqual({ a: 1 });
    expect(parseInjectPayload('json', '[1,2,3]')).toEqual([1, 2, 3]);
    expect(parseInjectPayload('json', 'invalid')).toEqual({});
  });

  it('parses boolean for bool type', () => {
    expect(parseInjectPayload('bool', 'true')).toBe(true);
    expect(parseInjectPayload('bool', 'false')).toBe(false);
    expect(parseInjectPayload('bool', 'anything')).toBe(false);
  });

  it('returns payload as-is for unknown type', () => {
    expect(parseInjectPayload('unknown', 'value')).toBe('value');
    expect(parseInjectPayload(undefined, 'value')).toBe('value');
  });
});
