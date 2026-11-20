import { Link } from 'react-router'

type ComingSoonProps = {
  title: string
  description: string
}

const ComingSoon = ({ title, description }: ComingSoonProps) => (
  <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8] px-5 py-12 text-slate-900">
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">Coming next</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg px-1 font-medium text-teal-900 underline underline-offset-4 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Back to home
      </Link>
    </div>
  </main>
)

export default ComingSoon
