import { useState, useCallback, useMemo, useEffect } from 'react';
import { nodeRegistry } from '../../nodes';
import { PaletteNode } from './PaletteNode';
import './Palette.css';

// Category display order - matches pagenodes1 style (input/output first, then function, etc.)
const CATEGORY_ORDER = ['common', 'input', 'output', 'ai', 'logic', 'transforms', 'networking', 'hardware', 'storage', 'other'];

// Display names for categories (when different from internal name)
const CATEGORY_DISPLAY_NAMES = {
  ai: 'AI'
};

const PALETTE_STATE_KEY = 'pagenodes2_palette_categories';

const DEFAULT_EXPANDED = {
  common: false,
  input: true,
  output: true,
  ai: true,
  logic: true,
  transforms: true,
  networking: true,
  hardware: true,
  storage: true
};

export function Palette() {
  const [expandedCategories, setExpandedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STATE_KEY);
      if (saved) {
        return { ...DEFAULT_EXPANDED, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Ignore parse errors
    }
    return DEFAULT_EXPANDED;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(PALETTE_STATE_KEY, JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  const categories = useMemo(() => {
    const cats = nodeRegistry.getCategories();
    return cats.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, []);

  // Filter nodes based on search query
  const filteredNodesByCategory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null; // null means no filtering

    const result = {};
    categories.forEach(category => {
      const nodes = nodeRegistry.getByCategory(category).filter(nodeDef => {
        const label = (nodeDef.paletteLabel || nodeDef.type).toLowerCase();
        const type = nodeDef.type.toLowerCase();
        const desc = (nodeDef.description || '').toLowerCase();
        return label.includes(query) || type.includes(query) || desc.includes(query);
      });
      if (nodes.length > 0) {
        result[category] = nodes;
      }
    });
    return result;
  }, [searchQuery, categories]);

  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const handleDragStart = useCallback((e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleTouchDrag = useCallback((nodeType, clientX, clientY) => {
    // Dispatch custom event for App.jsx to handle
    window.dispatchEvent(new CustomEvent('palette-touch-drop', {
      detail: { nodeType, clientX, clientY }
    }));
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const categoriesToShow = isSearching
    ? Object.keys(filteredNodesByCategory || {})
    : categories;

  return (
    <div className="palette">
      <div className="palette-header">
        <h3>Nodes</h3>
      </div>
      <div className="palette-search">
        <input
          type="text"
          className="palette-search-input"
          placeholder="Filter nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="palette-search-clear"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <div className="palette-content">
        {categoriesToShow.length === 0 && isSearching && (
          <div className="palette-no-results">No matching nodes</div>
        )}
        {categoriesToShow.map(category => {
          const nodes = isSearching
            ? filteredNodesByCategory[category]
            : nodeRegistry.getByCategory(category);
          const isExpanded = isSearching || expandedCategories[category];

          return (
            <div key={category} className="palette-category">
              <div
                className="category-header"
                onClick={() => !isSearching && toggleCategory(category)}
              >
                <span className={`category-toggle ${isExpanded ? 'expanded' : ''}`}>
                  ▶
                </span>
                <span className="category-name">{CATEGORY_DISPLAY_NAMES[category] || category}</span>
                {isSearching && <span className="category-count">{nodes.length}</span>}
              </div>
              {isExpanded && (
                <div className="category-nodes">
                  {nodes
                    .slice()
                    .sort((a, b) => {
                      const labelA = (a.paletteLabel || a.type).toLowerCase();
                      const labelB = (b.paletteLabel || b.type).toLowerCase();
                      return labelA.localeCompare(labelB);
                    })
                    .map(nodeDef => (
                      <PaletteNode
                        key={nodeDef.type}
                        nodeDef={nodeDef}
                        onDragStart={handleDragStart}
                        onTouchDrag={handleTouchDrag}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
