export function CheckboxInput({ checked, onChange, label, description }) {
  return (
    <div className="form-checkbox-wrapper">
      <label className="form-checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label && <span>{label}</span>}
      </label>
      {description && <div className="form-checkbox-description">{description}</div>}
    </div>
  );
}
