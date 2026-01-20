export function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="form-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
