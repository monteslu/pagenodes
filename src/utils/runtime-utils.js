/**
 * Runtime utility functions - extracted for testability
 * These are pure functions used by the runtime worker
 */

/**
 * Compare two config nodes to see if connection-relevant properties changed.
 * Ignores cosmetic properties like name, position.
 * Returns true if configs are equivalent (no reconnection needed).
 */
export function configsEqual(prevNode, newNode) {
  if (!prevNode || !newNode) return false;
  if (prevNode._node.type !== newNode._node.type) return false;

  // Get config properties (everything except _node)
  const prevConfig = { ...prevNode };
  const newConfig = { ...newNode };
  delete prevConfig._node;
  delete newConfig._node;

  // Compare serialized config (handles nested objects)
  return JSON.stringify(prevConfig) === JSON.stringify(newConfig);
}

/**
 * Normalize message output to array of arrays format
 * Handles: single msg, array of msgs, sparse arrays
 */
export function normalizeMessages(msg) {
  if (!msg) return null;

  // Already array of arrays
  if (Array.isArray(msg) && (msg.length === 0 || Array.isArray(msg[0]) || msg[0] === null || msg[0] === undefined)) {
    return msg;
  }

  // Single message - wrap in [[msg]]
  if (!Array.isArray(msg)) {
    return [[msg]];
  }

  // Array of messages for single output - wrap in [msgs]
  return [msg];
}

/**
 * Clone a message for sending to multiple recipients
 * Uses JSON parse/stringify for deep clone
 */
export function cloneMessage(msg) {
  try {
    return JSON.parse(JSON.stringify(msg));
  } catch {
    // If can't clone (circular refs, etc), return shallow copy
    return { ...msg };
  }
}

/**
 * Build error message object for catch nodes
 */
export function buildErrorMessage(sourceNode, errorText, originalMsg, errorObj, generateId) {
  const _msgid = originalMsg?._msgid || generateId();

  const errorMessage = {
    _msgid,
    error: {
      message: errorText,
      source: {
        id: sourceNode.id,
        type: sourceNode.type,
        name: sourceNode.name || sourceNode.type
      }
    }
  };

  // Add stack trace if available
  if (errorObj instanceof Error) {
    errorMessage.error.stack = errorObj.stack;
  }

  // Copy original message properties (except _msgid which we set)
  if (originalMsg && typeof originalMsg === 'object') {
    for (const key of Object.keys(originalMsg)) {
      if (key !== '_msgid' && key !== 'error') {
        errorMessage[key] = originalMsg[key];
      }
    }
  }

  return errorMessage;
}

/**
 * Sort catch nodes - regular catch nodes first, then uncaught-only
 */
export function sortCatchNodes(catchNodes) {
  return [...catchNodes].sort((a, b) => {
    const aUncaught = a.config?.scope === 'uncaught' ? 1 : 0;
    const bUncaught = b.config?.scope === 'uncaught' ? 1 : 0;
    return aUncaught - bUncaught;
  });
}

/**
 * Get a nested property from an object using dot notation
 * e.g., getProperty(obj, 'user.address.city')
 */
export function getProperty(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

/**
 * Set a nested property on an object using dot notation
 * Creates intermediate objects as needed
 */
export function setProperty(obj, path, value) {
  if (!path) return;
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => {
    if (!o[k]) o[k] = {};
    return o[k];
  }, obj);
  target[last] = value;
}

/**
 * Delete a nested property from an object using dot notation
 */
export function deleteProperty(obj, path) {
  if (!path) return;
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => o?.[k], obj);
  if (target) delete target[last];
}

/**
 * Parse inject node payload based on type
 */
export function parseInjectPayload(payloadType, payload) {
  switch (payloadType) {
    case 'date': return Date.now();
    case 'str': return payload;
    case 'num': return parseFloat(payload) || 0;
    case 'json':
      try { return JSON.parse(payload); }
      catch { return {}; }
    case 'bool': return payload === 'true';
    default: return payload;
  }
}
