import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for message routing logic
 * These test the core flow behavior with minimal mocking
 */

// Simplified RuntimeNode for testing message routing
class TestNode {
  constructor(id, type, wires = []) {
    this.id = id;
    this.type = type;
    this.wires = wires;
    this.receivedMessages = [];
    this.sentMessages = [];
  }

  receive(msg) {
    this.receivedMessages.push(msg);
    if (this.onInput) {
      this.onInput(msg);
    }
  }

  send(msg) {
    if (!msg) return;
    this.sentMessages.push(msg);

    // Normalize to array of arrays
    const msgs = Array.isArray(msg) ? msg : [[msg]];

    for (let outputIndex = 0; outputIndex < this.wires.length; outputIndex++) {
      const outputWires = this.wires[outputIndex] || [];
      const outputMsgs = msgs[outputIndex];

      if (!outputMsgs) continue;

      const msgsToSend = Array.isArray(outputMsgs) ? outputMsgs : [outputMsgs];

      for (const m of msgsToSend) {
        if (!m) continue;
        for (const targetId of outputWires) {
          const targetNode = this.nodeMap?.get(targetId);
          if (targetNode) {
            // Clone message for each recipient
            const clonedMsg = JSON.parse(JSON.stringify(m));
            targetNode.receive(clonedMsg);
          }
        }
      }
    }
  }
}

// Helper to create a flow of connected nodes
function createFlow(nodeConfigs) {
  const nodeMap = new Map();

  for (const config of nodeConfigs) {
    const node = new TestNode(config.id, config.type, config.wires || []);
    if (config.onInput) {
      node.onInput = config.onInput;
    }
    nodeMap.set(config.id, node);
  }

  // Link nodes to the map for routing
  for (const node of nodeMap.values()) {
    node.nodeMap = nodeMap;
  }

  return nodeMap;
}

describe('Message Routing', () => {
  describe('single output', () => {
    it('sends message to wired node', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['debug']] },
        { id: 'debug', type: 'debug', wires: [] }
      ]);

      const inject = flow.get('inject');
      const debug = flow.get('debug');

      inject.send({ payload: 'test' });

      expect(debug.receivedMessages).toHaveLength(1);
      expect(debug.receivedMessages[0].payload).toBe('test');
    });

    it('sends message to multiple wired nodes', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['debug1', 'debug2']] },
        { id: 'debug1', type: 'debug', wires: [] },
        { id: 'debug2', type: 'debug', wires: [] }
      ]);

      const inject = flow.get('inject');
      inject.send({ payload: 'test' });

      expect(flow.get('debug1').receivedMessages).toHaveLength(1);
      expect(flow.get('debug2').receivedMessages).toHaveLength(1);
    });

    it('clones message for each recipient', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['debug1', 'debug2']] },
        { id: 'debug1', type: 'debug', wires: [] },
        { id: 'debug2', type: 'debug', wires: [] }
      ]);

      const inject = flow.get('inject');
      inject.send({ payload: { value: 1 } });

      const msg1 = flow.get('debug1').receivedMessages[0];
      const msg2 = flow.get('debug2').receivedMessages[0];

      // Should be equal but not same object
      expect(msg1.payload).toEqual(msg2.payload);
      expect(msg1).not.toBe(msg2);
      expect(msg1.payload).not.toBe(msg2.payload);
    });
  });

  describe('multiple outputs', () => {
    it('routes to different outputs', () => {
      const flow = createFlow([
        { id: 'switch', type: 'switch', wires: [['out1'], ['out2']] },
        { id: 'out1', type: 'debug', wires: [] },
        { id: 'out2', type: 'debug', wires: [] }
      ]);

      const switchNode = flow.get('switch');

      // Send to first output only
      switchNode.send([[{ payload: 'first' }], null]);

      expect(flow.get('out1').receivedMessages).toHaveLength(1);
      expect(flow.get('out2').receivedMessages).toHaveLength(0);

      // Send to second output only
      switchNode.send([null, [{ payload: 'second' }]]);

      expect(flow.get('out1').receivedMessages).toHaveLength(1);
      expect(flow.get('out2').receivedMessages).toHaveLength(1);
    });

    it('sends to both outputs simultaneously', () => {
      const flow = createFlow([
        { id: 'switch', type: 'switch', wires: [['out1'], ['out2']] },
        { id: 'out1', type: 'debug', wires: [] },
        { id: 'out2', type: 'debug', wires: [] }
      ]);

      const switchNode = flow.get('switch');
      switchNode.send([
        [{ payload: 'for-out1' }],
        [{ payload: 'for-out2' }]
      ]);

      expect(flow.get('out1').receivedMessages[0].payload).toBe('for-out1');
      expect(flow.get('out2').receivedMessages[0].payload).toBe('for-out2');
    });
  });

  describe('message chains', () => {
    it('passes messages through chain of nodes', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['func']] },
        {
          id: 'func', type: 'function', wires: [['debug']],
          onInput(msg) {
            msg.payload = msg.payload.toUpperCase();
            this.send(msg);
          }
        },
        { id: 'debug', type: 'debug', wires: [] }
      ]);

      flow.get('inject').send({ payload: 'hello' });

      expect(flow.get('debug').receivedMessages[0].payload).toBe('HELLO');
    });

    it('handles branching and merging', () => {
      // inject -> [branch1, branch2] -> merge
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['branch1', 'branch2']] },
        {
          id: 'branch1', type: 'function', wires: [['merge']],
          onInput(msg) {
            this.send({ ...msg, branch: 1 });
          }
        },
        {
          id: 'branch2', type: 'function', wires: [['merge']],
          onInput(msg) {
            this.send({ ...msg, branch: 2 });
          }
        },
        { id: 'merge', type: 'debug', wires: [] }
      ]);

      flow.get('inject').send({ payload: 'test' });

      const merge = flow.get('merge');
      expect(merge.receivedMessages).toHaveLength(2);
      expect(merge.receivedMessages.map(m => m.branch).sort()).toEqual([1, 2]);
    });
  });

  describe('null/undefined handling', () => {
    it('does not send null messages', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['debug']] },
        { id: 'debug', type: 'debug', wires: [] }
      ]);

      flow.get('inject').send(null);
      flow.get('inject').send(undefined);

      expect(flow.get('debug').receivedMessages).toHaveLength(0);
    });

    it('skips null messages in array', () => {
      const flow = createFlow([
        { id: 'switch', type: 'switch', wires: [['out1'], ['out2']] },
        { id: 'out1', type: 'debug', wires: [] },
        { id: 'out2', type: 'debug', wires: [] }
      ]);

      // null in first position, message in second
      flow.get('switch').send([null, { payload: 'test' }]);

      expect(flow.get('out1').receivedMessages).toHaveLength(0);
      expect(flow.get('out2').receivedMessages).toHaveLength(1);
    });
  });

  describe('message properties', () => {
    it('preserves message properties through chain', () => {
      const flow = createFlow([
        { id: 'inject', type: 'inject', wires: [['debug']] },
        { id: 'debug', type: 'debug', wires: [] }
      ]);

      flow.get('inject').send({
        payload: 'data',
        topic: 'mytopic',
        _msgid: 'msg123',
        custom: { nested: true }
      });

      const received = flow.get('debug').receivedMessages[0];
      expect(received.payload).toBe('data');
      expect(received.topic).toBe('mytopic');
      expect(received._msgid).toBe('msg123');
      expect(received.custom.nested).toBe(true);
    });
  });
});

describe('Node receive/onInput', () => {
  it('calls onInput when message received', () => {
    const onInput = vi.fn();
    const flow = createFlow([
      { id: 'node', type: 'test', wires: [], onInput }
    ]);

    flow.get('node').receive({ payload: 'test' });

    expect(onInput).toHaveBeenCalledWith({ payload: 'test' });
  });

  it('allows onInput to modify and forward message', () => {
    const flow = createFlow([
      {
        id: 'transform', type: 'function', wires: [['debug']],
        onInput(msg) {
          this.send({ ...msg, transformed: true });
        }
      },
      { id: 'debug', type: 'debug', wires: [] }
    ]);

    flow.get('transform').receive({ payload: 'test' });

    expect(flow.get('debug').receivedMessages[0]).toEqual({
      payload: 'test',
      transformed: true
    });
  });

  it('allows onInput to send multiple messages', () => {
    const flow = createFlow([
      {
        id: 'split', type: 'split', wires: [['debug']],
        onInput(msg) {
          for (const item of msg.payload) {
            this.send({ payload: item });
          }
        }
      },
      { id: 'debug', type: 'debug', wires: [] }
    ]);

    flow.get('split').receive({ payload: [1, 2, 3] });

    expect(flow.get('debug').receivedMessages).toHaveLength(3);
    expect(flow.get('debug').receivedMessages.map(m => m.payload)).toEqual([1, 2, 3]);
  });

  it('allows onInput to suppress message (no send)', () => {
    const flow = createFlow([
      {
        id: 'filter', type: 'filter', wires: [['debug']],
        onInput(msg) {
          // Only forward if payload > 5
          if (msg.payload > 5) {
            this.send(msg);
          }
        }
      },
      { id: 'debug', type: 'debug', wires: [] }
    ]);

    flow.get('filter').receive({ payload: 3 });
    flow.get('filter').receive({ payload: 10 });

    expect(flow.get('debug').receivedMessages).toHaveLength(1);
    expect(flow.get('debug').receivedMessages[0].payload).toBe(10);
  });
});
