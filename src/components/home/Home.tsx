import { Link } from 'react-router'

import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PathCardProps = {
  number: string
  audience: string
  title: string
  description: string
  to: string
}

const PathCard = ({ number, audience, title, description, to }: PathCardProps) => (
  <Card className="gap-0 overflow-hidden rounded-2xl bg-white p-0 ring-1 ring-slate-200 transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-950/5 motion-reduce:transform-none motion-reduce:transition-none">
    <div className="h-1 bg-teal-800" />
    <div className="flex h-full flex-col p-6 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
          {audience}
        </span>
        <span aria-hidden="true" className="text-3xl font-light leading-none text-teal-700/60">
          {number}
        </span>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 max-w-md flex-1 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
        {description}
      </p>
      <Link
        to={to}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'mt-9 min-h-11 w-full justify-between rounded-lg bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto sm:min-w-52'
        )}
      >
        {title}
        <span aria-hidden="true" className="ml-5 text-lg leading-none">&rarr;</span>
      </Link>
    </div>
  </Card>
)

const Home = () => (
  <div className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-slate-200/80 py-6 sm:py-8">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-teal-900 text-white shadow-sm">
            <span className="relative block size-5">
              <span className="absolute left-0 top-0 size-3 rounded-sm border-2 border-current" />
              <span className="absolute bottom-0 right-0 size-3 rounded-sm border-2 border-current" />
            </span>
          </span>
          <span className="text-base font-semibold tracking-tight sm:text-lg">Career Matcher</span>
        </div>
        <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-slate-500 sm:block">
          Assessment prototype
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center py-14 sm:py-20 lg:py-24">
        <section aria-labelledby="home-heading" className="max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
            Explore what comes next
          </p>
          <h1 id="home-heading" className="text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Explore the questions. Preview the assessment journey.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Career Matcher brings two paths together: reviewers will be able to inspect assessment questions and their presentation, while students will eventually move through a guided assessment.
          </p>
        </section>

        <section aria-labelledby="paths-heading" className="mt-12 sm:mt-16">
          <div className="mb-5 flex items-baseline gap-4">
            <h2 id="paths-heading" className="text-sm font-semibold text-slate-900">Choose a path</h2>
            <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <PathCard
              number="01"
              audience="For reviewers"
              title="Explore Questions"
              description="The planned explorer will let reviewers browse questions by assessment model, inspect question types and presentation, and review linked images and media."
              to="/questions"
            />
            <PathCard
              number="02"
              audience="For students"
              title="Start Assessment"
              description="Enter your name and email to begin the assessment and continue toward your report."
              to="/assessment"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 py-6 text-xs text-slate-500">
        Career Matcher | Assessment prototype
      </footer>
    </div>
  </div>
)

export default Home
