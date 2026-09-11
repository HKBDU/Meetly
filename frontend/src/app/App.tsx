export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-600">Meetly</h1>
        <p className="mt-2 text-slate-600">
          When2meet clone - Real-time meeting scheduling with React, Vite & Tailwind CSS.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Frontend: React + Vite + Tailwind
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Backend: .NET + SignalR
          </span>
        </div>
      </div>
    </div>
  )
}
