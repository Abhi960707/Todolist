import React from 'react'

const AuthLayout = ({ eyebrow, title, description, footer, children }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2ff_35%,#e2e8f0_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0.2))]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_35px_120px_rgba(15,23,42,0.14)] backdrop-blur xl:grid-cols-[1fr_0.92fr]">
        <section className="flex flex-col justify-center border-b border-slate-200/70 px-6 py-10 text-center sm:px-10 lg:px-12 xl:border-b-0 xl:border-r xl:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 xl:mx-0">
            {description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-5">
              <p className="text-2xl font-semibold text-slate-900">Clean</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">Auth flow</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-5">
              <p className="text-2xl font-semibold text-slate-900">Stable</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">User access</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-5">
              <p className="text-2xl font-semibold text-slate-900">Ready</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">Team workflow</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:px-8">
            {children}
            {footer}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
