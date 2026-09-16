import { useFormContext } from 'react-hook-form'
import { eventUi } from '../../../shared/components/ui/styles'
import type { AdminCredentialsFieldsProps, CredentialsFormValues } from '../types'

export function AdminCredentialsFields({
  usernameRequired = false,
  passwordRequired = false,
}: AdminCredentialsFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CredentialsFormValues>()

  return (
    <fieldset className={eventUi.adminFieldset}>
      <legend className={eventUi.adminLegend}>
        Admin credentials{' '}
        {!usernameRequired && !passwordRequired && (
          <span className={eventUi.adminOptional}>Optional</span>
        )}
      </legend>
      <div className={eventUi.adminGrid}>
        <div className={eventUi.field}>
          <label className={eventUi.label} htmlFor="admin-username">
            Username {usernameRequired && <span className={eventUi.requiredMark}>*</span>}
          </label>
          <input
            aria-invalid={Boolean(errors.adminUsername)}
            className={eventUi.input}
            id="admin-username"
            {...register('adminUsername')}
            required={usernameRequired}
          />
          {errors.adminUsername?.message && (
            <span className={eventUi.fieldError}>{errors.adminUsername.message}</span>
          )}
        </div>
        <div className={eventUi.field}>
          <label className={eventUi.label} htmlFor="admin-password">
            Password {passwordRequired && <span className={eventUi.requiredMark}>*</span>}
          </label>
          <input
            aria-invalid={Boolean(errors.adminPassword)}
            className={eventUi.input}
            id="admin-password"
            type="password"
            {...register('adminPassword')}
            required={passwordRequired}
          />
          {errors.adminPassword?.message && (
            <span className={eventUi.fieldError}>{errors.adminPassword.message}</span>
          )}
        </div>
      </div>
    </fieldset>
  )
}
