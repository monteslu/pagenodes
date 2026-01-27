export const mathNode = {
  type: 'math',
  category: 'logic',
  description: 'Performs mathematical operations',
  label: (node) => node.name || 'math',
  color: '#778899', // light slate gray
  icon: true,
  faChar: '\uf1ec', // calculator
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'add', options: [
      { value: 'add', label: 'Add (+)' },
      { value: 'subtract', label: 'Subtract (-)' },
      { value: 'multiply', label: 'Multiply (×)' },
      { value: 'divide', label: 'Divide (÷)' },
      { value: 'modulo', label: 'Modulo (%)' },
      { value: 'abs', label: 'Absolute' },
      { value: 'round', label: 'Round' },
      { value: 'floor', label: 'Floor' },
      { value: 'ceil', label: 'Ceiling' },
      { value: 'sqrt', label: 'Square Root' },
      { value: 'pow', label: 'Power' },
      { value: 'min', label: 'Minimum' },
      { value: 'max', label: 'Maximum' },
      { value: 'random', label: 'Random' },
      { value: 'sin', label: 'Sine' },
      { value: 'cos', label: 'Cosine' },
      { value: 'tan', label: 'Tangent' },
      { value: 'log', label: 'Natural Log' },
      { value: 'log10', label: 'Log Base 10' }
    ]},
    operand: { type: 'string', default: '' },
    operandType: { type: 'select', default: 'num', options: [
      { value: 'num', label: 'Number' },
      { value: 'msg', label: 'msg.' }
    ]}
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'number',
        description: 'Numeric value to perform operation on'
      }
    },
    writes: {
      payload: {
        type: 'number',
        description: 'Result of the mathematical operation'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Performs mathematical operations on <code>msg.payload</code>.</p>

        <h5>Operations</h5>
        <ul>
          <li><strong>Basic</strong>: Add, Subtract, Multiply, Divide, Modulo</li>
          <li><strong>Rounding</strong>: Round, Floor, Ceiling, Absolute</li>
          <li><strong>Advanced</strong>: Square Root, Power, Natural Log, Log10</li>
          <li><strong>Trigonometry</strong>: Sine, Cosine, Tangent</li>
          <li><strong>Comparison</strong>: Minimum, Maximum</li>
          <li><strong>Random</strong>: Random number (0-1, or 0 to operand)</li>
        </ul>

        <h5>Operand</h5>
        <p>For operations that need a second value (add, multiply, etc.), specify:</p>
        <ul>
          <li><strong>Number</strong> - A fixed numeric value</li>
          <li><strong>msg.</strong> - Read value from another message property</li>
        </ul>

        <h5>Example</h5>
        <p>To convert Fahrenheit to Celsius:</p>
        <ol>
          <li>Subtract 32</li>
          <li>Multiply by 0.5556</li>
        </ol>
      </>
    );
  }
};
