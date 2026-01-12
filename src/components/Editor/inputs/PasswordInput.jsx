export function PasswordInput({ value, onChange, placeholder }) {
  return (
    <input
      type="password"
      className="form-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
