import { JSHINT } from 'jshint';
import * as prettier from 'prettier/standalone';
import prettierBabel from 'prettier/plugins/babel';
import prettierEstree from 'prettier/plugins/estree';

// Prettier options
const PRETTIER_OPTIONS = {
  parser: 'babel',
  plugins: [prettierBabel, prettierEstree],
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  printWidth: 80
};

// JSHint options for function node code
const JSHINT_OPTIONS = {
  esversion: 11,
  asi: true,        // Allow missing semicolons
  expr: true,       // Allow expression statements
  undef: true,      // Warn about undefined variables
  unused: 'vars',   // Warn about unused variables (but not params)
  globals: {
    // Function parameters
    msg: true,
    node: true,
    context: true,
    flow: true,
    global: true,
    // Common globals
    console: true,
    setTimeout: true,
    clearTimeout: true,
    setInterval: true,
    clearInterval: true,
    Promise: true,
    Date: true,
    Math: true,
    JSON: true,
    Object: true,
    Array: true,
    String: true,
    Number: true,
    Boolean: true,
    RegExp: true,
    Error: true,
    Map: true,
    Set: true,
    parseInt: true,
    parseFloat: true,
    isNaN: true,
    isFinite: true,
    encodeURIComponent: true,
    decodeURIComponent: true,
  }
};

function lintCode(code) {
  JSHINT(code, JSHINT_OPTIONS);
  return JSHINT.errors.filter(Boolean).map(err => ({
    line: err.line,
    character: err.character,
    reason: err.reason,
    code: err.code
  }));
}

async function formatCode(code) {
  try {
    return await prettier.format(code, PRETTIER_OPTIONS);
  } catch (err) {
    // Return original if formatting fails (e.g., syntax error)
    return null;
  }
}

export const functionNode = {
  type: 'function',
  category: 'function',
  label: (node) => node._node.name || 'function',
  color: '#fdd0a2',
  icon: true,
  faChar: 'ƒ', // function symbol
  inputs: 1,
  outputs: 1,

  defaults: {
    func: { type: 'string', default: 'return msg;' },
    outputs: { type: 'number', default: 1 },
    initialize: { type: 'string', default: '' },
    finalize: { type: 'string', default: '' }
  },

  // Dynamic outputs based on config
  getOutputs(node) {
    return node.outputs || 1;
  },

  renderEditor(PN) {
    const { TextInput, NumberInput, CodeInput } = PN.components;
    const { useNodeValue, useNodeName, useState } = PN.hooks;

    const [name, setName] = useNodeName();
    const [func, setFunc] = useNodeValue('func');
    const [outputs, setOutputs] = useNodeValue('outputs');
    const [initialize, setInitialize] = useNodeValue('initialize');
    const [finalize, setFinalize] = useNodeValue('finalize');
    const [errors, setErrors] = useState(null); // null = not linted yet
    const [showSetup, setShowSetup] = useState(false);

    const handleLint = () => {
      const lintErrors = lintCode(func || '');
      setErrors(lintErrors);
    };

    const handleFormat = async () => {
      const formatted = await formatCode(func || '');
      if (formatted !== null) {
        setFunc(formatted.trim());
        setErrors(null); // Reset lint state after format
      }
    };

    return (
      <>
        <div className="form-row">
          <label>Name</label>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Node name (optional)"
          />
        </div>

        <div className="form-row">
          <label>Outputs</label>
          <NumberInput
            value={outputs}
            onChange={setOutputs}
            min={1}
            max={10}
          />
        </div>

        <div className="form-row">
          <label>Function</label>
          <CodeInput
            value={func}
            onChange={setFunc}
            language="javascript"
          />
        </div>

        <div className="form-row">
          <label></label>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-small"
              onClick={handleLint}
            >
              Lint
            </button>
            {errors !== null && errors.length === 0 && <span style={{ color: '#6a9955', fontSize: '11px' }}>✓</span>}
            {errors !== null && errors.length > 0 && <span style={{ color: '#f44', fontSize: '11px' }}>{errors.length} issue{errors.length > 1 ? 's' : ''}</span>}
            <button
              type="button"
              className="btn btn-small"
              onClick={handleFormat}
            >
              Format
            </button>
          </div>
        </div>

        {errors !== null && errors.length > 0 && (
          <div className="form-row">
            <label></label>
            <div className="lint-errors">
              {errors.map((err, i) => (
                <div key={i} className="lint-error">
                  <span className="lint-error-line">Line {err.line}:{err.character}</span>
                  <span className="lint-error-reason">{err.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-row">
          <label></label>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setShowSetup(!showSetup)}
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            {showSetup ? '▼ Hide' : '▶ Setup'} (initialize/finalize)
          </button>
        </div>

        {showSetup && (
          <>
            <div className="form-row">
              <label>Initialize</label>
              <CodeInput
                value={initialize}
                onChange={setInitialize}
                language="javascript"
              />
            </div>

            <div className="form-row">
              <label>Finalize</label>
              <CodeInput
                value={finalize}
                onChange={setFinalize}
                language="javascript"
              />
            </div>
          </>
        )}
      </>
    );
  },

  // This will run in WASM sandbox
  onInput(msg) {
    // The actual execution happens in the QuickJS sandbox
    // This is just a placeholder - the runtime will handle it
    return msg;
  }
};
