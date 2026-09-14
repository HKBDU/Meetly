import { eventUi } from './styles'

type AdminCredentialsFieldsProps = { username: string; password: string; onUsernameChange: (value: string) => void; onPasswordChange: (value: string) => void; usernameRequired?: boolean; passwordRequired?: boolean; error?: string }

export function AdminCredentialsFields({ username, password, onUsernameChange, onPasswordChange, usernameRequired = false, passwordRequired = false, error }: AdminCredentialsFieldsProps) {
  return <fieldset className={eventUi.adminFieldset}>
    <legend className={eventUi.adminLegend}>Admin credentials {!usernameRequired && !passwordRequired && <span className={eventUi.adminOptional}>Optional</span>}</legend>
    <div className={eventUi.adminGrid}>
      <div className={eventUi.field}><label className={eventUi.label} htmlFor="admin-username">Username {usernameRequired && <span className={eventUi.requiredMark}>*</span>}</label><input aria-invalid={Boolean(error)} className={eventUi.input} id="admin-username" onChange={(event) => onUsernameChange(event.target.value)} required={usernameRequired} value={username} /></div>
      <div className={eventUi.field}><label className={eventUi.label} htmlFor="admin-password">Password {passwordRequired && <span className={eventUi.requiredMark}>*</span>}</label><input aria-invalid={Boolean(error)} className={eventUi.input} id="admin-password" onChange={(event) => onPasswordChange(event.target.value)} required={passwordRequired} type="password" value={password} /></div>
    </div>
    {error && <span className={eventUi.fieldError}>{error}</span>}
  </fieldset>
}
