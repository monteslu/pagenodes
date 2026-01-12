export function CheckboxInput({ checked, onChange, label }) {
  return (
    <label className="form-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
