const PAYLOAD_TYPES = [
  { value: 'date', label: 'Timestamp' },
  { value: 'str', label: 'String' },
  { value: 'num', label: 'Number' },
  { value: 'json', label: 'JSON' },
  { value: 'bool', label: 'Boolean' }
];

const REPEAT_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'interval', label: 'Interval' }
];

const REPEAT_UNITS = [
  { value: 's', label: 'Seconds' },
  { value: 'ms', label: 'Milliseconds' },
  { value: 'm', label: 'Minutes' },
  { value: 'h', label: 'Hours' }
];

export const injectNode = {
  type: 'inject',
  category: 'input',
  description: 'Injects a message into the flow manually or on a timer',
  label: (node) => node.name || 'inject',
  color: '#a6bbcf', // light grayish-blue
  icon: true,
  faChar: '\uf061', // arrow-right
  inputs: 0,
  outputs: 1,
  button: true, // Show button to manually trigger injection

  defaults: {
    payloadType: { type: 'string', default: 'date' },
    payload: { type: 'string', default: '' },
    topic: { type: 'string', default: '' },
    repeatType: { type: 'string', default: 'none' },
    repeatInterval: { type: 'number', default: 1 },
    repeatUnits: { type: 'string', default: 's' },
    once: { type: 'boolean', default: false },
    allowDebugInput: { type: 'boolean', default: false }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Configured value (timestamp, string, number, JSON object, or boolean)'
      },
      topic: {
        type: 'string',
        description: 'Routing topic (configured)',
        optional: true
      }
    }
  },

  renderEditor(PN) {
    const { TextInput, SelectInput, CheckboxInput, CodeInput } = PN.components;
    const { useNodeValue, useNodeName } = PN.hooks;

    const [name, setName] = useNodeName();
    const [payloadType, setPayloadType] = useNodeValue('payloadType');
    const [payload, setPayload] = useNodeValue('payload');
    const [topic, setTopic] = useNodeValue('topic');
    const [repeatType, setRepeatType] = useNodeValue('repeatType');
    const [repeatInterval, setRepeatInterval] = useNodeValue('repeatInterval');
    const [repeatUnits, setRepeatUnits] = useNodeValue('repeatUnits');
    const [once, setOnce] = useNodeValue('once');
    const [allowDebugInput, setAllowDebugInput] = useNodeValue('allowDebugInput');

    const showPayloadValue = payloadType !== 'date';
    const isJson = payloadType === 'json';

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
          <label>Payload</label>
          <SelectInput
            value={payloadType}
            options={PAYLOAD_TYPES}
            onChange={setPayloadType}
          />
        </div>

        {showPayloadValue && !isJson && (
          <div className="form-row">
            <label>Value</label>
            <TextInput
              value={payload}
              onChange={setPayload}
              placeholder="value"
            />
          </div>
        )}

        {isJson && (
          <div className="form-row">
            <label>Value</label>
            <CodeInput
              value={payload}
              onChange={setPayload}
              language="json"
            />
          </div>
        )}

        <div className="form-row">
          <label>Topic</label>
          <TextInput
            value={topic}
            onChange={setTopic}
            placeholder=""
          />
        </div>

        <div className="form-row">
          <label>Repeat</label>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <SelectInput
              value={repeatType}
              options={REPEAT_TYPES}
              onChange={setRepeatType}
            />
            {repeatType === 'interval' && (
              <>
                <TextInput
                  value={repeatInterval}
                  onChange={(v) => setRepeatInterval(parseFloat(v) || 1)}
                  style={{ width: '60px' }}
                  type="number"
                />
                <SelectInput
                  value={repeatUnits}
                  options={REPEAT_UNITS}
                  onChange={setRepeatUnits}
                />
              </>
            )}
          </div>
        </div>

        <div className="form-row">
          <label></label>
          <CheckboxInput
            checked={once}
            onChange={setOnce}
            label="Inject once at start"
          />
        </div>

        <div className="form-row">
          <label></label>
          <CheckboxInput
            checked={allowDebugInput}
            onChange={setAllowDebugInput}
            label="Accept debug input"
          />
        </div>
      </>
    );
  },

  renderHelp() {
    return (
      <>
        <p>Injects a message into a flow either manually or at regular intervals. Click the button on the left side of the node to manually trigger an injection.</p>

        <h5>Payload Types</h5>
        <ul>
          <li><strong>Timestamp</strong> - Current time in milliseconds since epoch</li>
          <li><strong>String</strong> - Text value</li>
          <li><strong>Number</strong> - Numeric value</li>
          <li><strong>JSON</strong> - Parsed JSON object</li>
          <li><strong>Boolean</strong> - true or false</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Topic</strong> - Sets <code>msg.topic</code> for routing/filtering</li>
          <li><strong>Repeat</strong> - Interval to auto-inject (seconds, minutes, hours)</li>
          <li><strong>Inject once at start</strong> - Automatically inject when flow deploys</li>
          <li><strong>Accept debug input</strong> - Allow text injection from debug panel</li>
        </ul>

        <h5>Output</h5>
        <pre>{`{
  payload: <configured value>,
  topic: "<configured topic>"
}`}</pre>
      </>
    );
  }
};
