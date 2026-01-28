/**
 * Node validation utilities
 */

import { nodeRegistry } from '../nodes';

/**
 * Validate a single node's configuration
 * @param {object} node - Flat node object with all properties at top level
 * @returns {string[]} - Array of error messages (empty if valid)
 */
export function validateNode(node) {
  const errors = [];
  const def = nodeRegistry.get(node.type);

  if (!def) return errors;

  // Check required fields
  if (def.defaults) {
    for (const [key, propDef] of Object.entries(def.defaults)) {
      if (propDef.required) {
        const value = node[key];
        if (value === undefined || value === null || value === '') {
          const label = propDef.label || key;
          errors.push(`${label} is required`);
        }
      }
    }
  }

  // Run custom validate function if present
  if (def.validate) {
    const customErrors = def.validate(node);
    if (Array.isArray(customErrors)) {
      errors.push(...customErrors);
    }
  }

  return errors;
}

/**
 * Validate all nodes
 * @param {object} nodes - Object mapping node IDs to nodes
 * @returns {Map<string, string[]>} - Map of node ID to error messages
 */
export function validateAllNodes(nodes) {
  const errorMap = new Map();

  for (const [id, node] of Object.entries(nodes)) {
    const errors = validateNode(node);
    if (errors.length > 0) {
      errorMap.set(id, errors);
    }
  }

  return errorMap;
}
