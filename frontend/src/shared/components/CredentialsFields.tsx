import { useFormContext } from 'react-hook-form'
import { eventUi } from '@/shared/components/ui/styles'

export type CredentialsFieldsProps = {
  title?: string
  usernameLabel?: string
  passwordLabel?: string
  usernameName?: string
  passwordName?: string
  usernameRequired?: boolean
  passwordRequired?: boolean
}

export function CredentialsFields({
  title = 'Credentials',
  usernameLabel = 'Username',
  passwordLabel = 'Password',
  usernameName = 'adminUsername',
  passwordName = 'adminPassword',
  usernameRequired = false,
  passwordRequired = false,
}: CredentialsFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<Record<string, any>>()

  const usernameError = errors[usernameName]?.message as string | undefined
  const passwordError = errors[passwordName]?.message as string | undefined

  return (
    <fieldset className={eventUi.adminFieldset}>
      <legend className={eventUi.adminLegend}>
        {title}{' '}
        {!usernameRequired && !passwordRequired && (
          <span className={eventUi.adminOptional}>Optional</span>
        )}
      </legend>
      <div className={eventUi.adminGrid}>
        <div className={eventUi.field}>
          <label className={eventUi.label} htmlFor={usernameName}>
            {usernameLabel} {usernameRequired && <span className={eventUi.requiredMark}>*</span>}
          </label>
          <input
            aria-invalid={Boolean(usernameError)}
            className={eventUi.input}
            id={usernameName}
            {...register(usernameName)}
            required={false}
          />
          {(usernameError || passwordError) && (
            <span className={eventUi.fieldError}>{usernameError}</span>
          )}
        </div>
        <div className={eventUi.field}>
          <label className={eventUi.label} htmlFor={passwordName}>
            {passwordLabel} {passwordRequired && <span className={eventUi.requiredMark}>*</span>}
          </label>
          <input
            aria-invalid={Boolean(passwordError)}
            className={eventUi.input}
            id={passwordName}
            type="password"
            {...register(passwordName)}
            required={passwordRequired}
          />
          {(passwordError || usernameError)  &&   (
            <span className={eventUi.fieldError}>{passwordError}</span>
          )}
        </div>
      </div>
    </fieldset>
  )
}
