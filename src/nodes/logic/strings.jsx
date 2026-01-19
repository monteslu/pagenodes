export const stringsNode = {
  type: 'strings',
  category: 'logic',
  description: 'Performs string operations using lodash',
  label: (node) => node._node.name || 'strings',
  color: '#66d9ef', // light blue
  icon: true,
  faChar: '\uf031', // font
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'camelCase', options: [
      // Case conversion (lodash)
      { value: 'camelCase', label: 'camelCase' },
      { value: 'capitalize', label: 'Capitalize' },
      { value: 'kebabCase', label: 'kebab-case' },
      { value: 'lowerCase', label: 'lower case' },
      { value: 'lowerFirst', label: 'lowerFirst' },
      { value: 'snakeCase', label: 'snake_case' },
      { value: 'startCase', label: 'Start Case' },
      { value: 'toLower', label: 'To Lower' },
      { value: 'toUpper', label: 'To Upper' },
      { value: 'upperCase', label: 'UPPER CASE' },
      { value: 'upperFirst', label: 'UpperFirst' },

      // Trim & Pad (lodash)
      { value: 'trim', label: 'Trim' },
      { value: 'trimStart', label: 'Trim Start' },
      { value: 'trimEnd', label: 'Trim End' },
      { value: 'pad', label: 'Pad' },
      { value: 'padStart', label: 'Pad Start' },
      { value: 'padEnd', label: 'Pad End' },

      // Transform (lodash)
      { value: 'deburr', label: 'Deburr (remove accents)' },
      { value: 'escape', label: 'Escape HTML' },
      { value: 'unescape', label: 'Unescape HTML' },
      { value: 'escapeRegExp', label: 'Escape RegExp' },
      { value: 'repeat', label: 'Repeat' },
      { value: 'replace', label: 'Replace' },
      { value: 'split', label: 'Split' },
      { value: 'words', label: 'Words (to array)' },
      { value: 'parseInt', label: 'Parse Int' },

      // Search (lodash)
      { value: 'startsWith', label: 'Starts With' },
      { value: 'endsWith', label: 'Ends With' },

      // Custom functions
      { value: 'concatString', label: 'Concatenate' },
      { value: 'substring', label: 'Substring' },
      { value: 'scrollText', label: 'Scroll Text' },

      // Native JS functions
      { value: 'length', label: 'Length' },
      { value: 'charAt', label: 'Char At' },
      { value: 'charCodeAt', label: 'Char Code At' },
      { value: 'indexOf', label: 'Index Of' },
      { value: 'lastIndexOf', label: 'Last Index Of' },
      { value: 'slice', label: 'Slice' },
      { value: 'match', label: 'Match (Regex)' },
      { value: 'search', label: 'Search (Regex)' },
      { value: 'normalize', label: 'Normalize Unicode' },
      { value: 'at', label: 'At (index)' }
    ]},
    arg1: { type: 'string', default: '', label: 'Argument 1' },
    arg2: { type: 'string', default: '', label: 'Argument 2' },
    arg3: { type: 'string', default: '', label: 'Argument 3' }
  },

  renderHelp() {
    return (
      <>
        <p>Performs string manipulation using lodash functions. Input can be any type - it will be coerced to string.</p>

        <h5>Case Conversion</h5>
        <ul>
          <li><strong>camelCase</strong>: "hello world" → "helloWorld"</li>
          <li><strong>capitalize</strong>: "hello" → "Hello"</li>
          <li><strong>kebab-case</strong>: "Hello World" → "hello-world"</li>
          <li><strong>snake_case</strong>: "Hello World" → "hello_world"</li>
          <li><strong>Start Case</strong>: "helloWorld" → "Hello World"</li>
          <li><strong>lowerFirst/upperFirst</strong>: Change first character only</li>
        </ul>

        <h5>Trim & Pad</h5>
        <ul>
          <li><strong>Trim</strong>: Remove whitespace (or arg1 chars) from both ends</li>
          <li><strong>Pad</strong>: arg1 = length, arg2 = pad chars (default space)</li>
        </ul>

        <h5>Transform</h5>
        <ul>
          <li><strong>Deburr</strong>: Remove accents: "déjà vu" → "deja vu"</li>
          <li><strong>Escape/Unescape HTML</strong>: Convert &lt; &gt; &amp; etc.</li>
          <li><strong>Replace</strong>: arg1 = pattern, arg2 = replacement</li>
          <li><strong>Split</strong>: arg1 = separator, arg2 = limit</li>
          <li><strong>Words</strong>: Split into array of words</li>
          <li><strong>Scroll Text</strong>: Rotate string by arg1 positions</li>
        </ul>

        <h5>Search</h5>
        <ul>
          <li><strong>Starts/Ends With</strong>: arg1 = target, arg2 = position</li>
          <li><strong>Index Of</strong>: arg1 = search string, arg2 = from index</li>
          <li><strong>Match</strong>: arg1 = regex pattern (returns array)</li>
        </ul>

        <h5>Arguments can be overridden via msg.arg1, msg.arg2, msg.arg3</h5>
      </>
    );
  }
};
