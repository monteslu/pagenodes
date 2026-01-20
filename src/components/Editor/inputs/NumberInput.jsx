export function NumberInput({ value, onChange, min, max }) {
  return (
    <input
      type="number"
      className="form-input"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      min={min}
      max={max}
    />
  );
}
