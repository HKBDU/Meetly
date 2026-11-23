import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { RotateCw } from 'lucide-react'

import { Button, buttonVariants } from '@/shared/components/ui/button'

/** Trang lỗi thay cho màn lỗi mặc định của React Router; chi tiết lỗi chỉ hiện khi dev */
export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const detail = error instanceof Error ? error.message : isRouteErrorResponse(error) ? error.statusText : String(error)

  return (
    <div className="app-event-background flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="font-serif text-6xl text-muted-foreground italic">{notFound ? '404' : 'Oops'}</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {notFound ? "This page doesn't exist" : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {notFound ? 'Check the link, or head back home.' : 'Please reload the page. If it keeps happening, try again in a moment.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {!notFound && (
            <Button onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              Reload
            </Button>
          )}
          <Link to="/" reloadDocument className={buttonVariants({ variant: 'outline' })}>
            Go home
          </Link>
        </div>
        {import.meta.env.DEV && detail && (
          <pre className="mt-8 overflow-x-auto rounded-xl border bg-card p-4 text-left text-xs text-muted-foreground">{detail}</pre>
        )}
      </div>
    </div>
  )
}
