import { useState } from "react";

/**
 * Reusable PasswordInput component with eye icon toggle.
 *
 * @param {object} props
 * @param {string} props.id - Input HTML id
 * @param {string} props.value - Controlled input value
 * @param {function} props.onChange - Handler for value change
 * @param {string} [props.placeholder="••••••••"] - Input placeholder
 * @param {string} [props.className="um-form-input"] - Input CSS class name
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {string} [props.autoComplete] - HTML autocomplete hint
 * @param {string} [props.name] - Input field name
 * @param {number} [props.minLength] - Minimum character length
 * @param {number} [props.maxLength] - Maximum character length
 */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  className = "um-form-input",
  required = false,
  disabled = false,
  autoComplete,
  name,
  minLength,
  maxLength,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="password-input-wrap">
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} password-input-field`}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        {...rest}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
      >
        <span className="material-symbols-outlined password-toggle-icon" aria-hidden="true">
          {showPassword ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

export default PasswordInput;
