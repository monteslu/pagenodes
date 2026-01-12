import { useState, useCallback, useMemo, useEffect } from 'react';
import { nodeRegistry } from '../../nodes';
import { PaletteNode } from './PaletteNode';
import './Palette.css';

// Category display order - matches pagenodes1 style (input/output first, then function, etc.)
const CATEGORY_ORDER = ['common', 'input', 'output', 'function', 'hardware', 'sequence', 'storage', 'network', 'other'];

const PALETTE_STATE_KEY = 'pagenodes2_palette_categories';

const DEFAULT_EXPANDED = {
  common: false,
  input: true,
  output: true,
  function: true,
  hardware: true,
  sequence: true,
  storage: true,
  network: true
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

  return (
    <div className="palette">
      <div className="palette-header">
        <h3>Nodes</h3>
      </div>
      <div className="palette-content">
        {categories.map(category => (
          <div key={category} className="palette-category">
            <div
              className="category-header"
              onClick={() => toggleCategory(category)}
            >
              <span className={`category-toggle ${expandedCategories[category] ? 'expanded' : ''}`}>
                ▶
              </span>
              <span className="category-name">{category}</span>
            </div>
            {expandedCategories[category] && (
              <div className="category-nodes">
                {nodeRegistry.getByCategory(category)
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
                    />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
