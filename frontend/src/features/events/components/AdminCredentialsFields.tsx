type AdminCredentialsFieldsProps = { username: string; password: string; onUsernameChange: (value: string) => void; onPasswordChange: (value: string) => void; usernameRequired?: boolean; passwordRequired?: boolean; error?: string }

export function AdminCredentialsFields({ username, password, onUsernameChange, onPasswordChange, usernameRequired = false, passwordRequired = false, error }: AdminCredentialsFieldsProps) {
  return <fieldset className="admin-fields">
    <legend>Admin credentials {!usernameRequired && !passwordRequired && <span>Optional</span>}</legend>
    <div className="admin-fields__grid">
      <div className="form-field"><label htmlFor="admin-username">Username {usernameRequired && <span className="required-mark">*</span>}</label><input aria-invalid={Boolean(error)} id="admin-username" onChange={(event) => onUsernameChange(event.target.value)} required={usernameRequired} value={username} /></div>
      <div className="form-field"><label htmlFor="admin-password">Password {passwordRequired && <span className="required-mark">*</span>}</label><input aria-invalid={Boolean(error)} id="admin-password" onChange={(event) => onPasswordChange(event.target.value)} required={passwordRequired} type="password" value={password} /></div>
    </div>
    {error && <span className="field-error">{error}</span>}
  </fieldset>
}
