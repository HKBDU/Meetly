type AdminCredentialsFieldsProps = { username: string; password: string; onUsernameChange: (value: string) => void; onPasswordChange: (value: string) => void }

export function AdminCredentialsFields({ username, password, onUsernameChange, onPasswordChange }: AdminCredentialsFieldsProps) {
  return <fieldset className="admin-fields">
    <legend>Admin credentials <span>Optional</span></legend>
    <div className="admin-fields__grid">
      <div className="form-field"><label htmlFor="admin-username">Username</label><input id="admin-username" onChange={(event) => onUsernameChange(event.target.value)} value={username} /></div>
      <div className="form-field"><label htmlFor="admin-password">Password</label><input id="admin-password" onChange={(event) => onPasswordChange(event.target.value)} type="password" value={password} /></div>
    </div>
  </fieldset>
}
