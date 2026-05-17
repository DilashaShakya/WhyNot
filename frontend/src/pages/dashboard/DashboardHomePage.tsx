import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const steps = [
  {
    to: '/app/resume',
    num: '01',
    title: 'Upload your resume',
    body: 'Add a PDF resume. The text is parsed automatically and ready to work with.',
  },
  {
    to: '/app/job',
    num: '02',
    title: 'Add a job description',
    body: 'Paste any job posting and save the target role and company.',
  },
  {
    to: '/app/job',
    num: '03',
    title: 'Get recruiter feedback',
    body: 'Generate honest AI feedback: strengths, rejection risks, missing keywords, and bullet rewrites.',
  },
  {
    to: '/app/studio',
    num: '04',
    title: 'Improve in the studio',
    body: 'Edit bullets, run rewrites, scan for impact gaps, then download your improved resume.',
  },
]

export function DashboardHomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-10"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Resume strategist
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Upload your resume, add a job description, and get honest AI-powered recruiter feedback—then refine
          your resume in the studio.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.07 }}
          >
            <Link to={s.to} className="group block h-full">
              <div className="h-full rounded-lg border border-neutral-200 bg-white p-5 transition-colors group-hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:group-hover:border-neutral-700">
                <span className="text-[11px] font-semibold tabular-nums tracking-widest text-neutral-300 dark:text-neutral-600">
                  {s.num}
                </span>
                <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{s.body}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-8 dark:border-neutral-800">
        <Link
          to="/app/resume"
          className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          My resume
        </Link>
        <Link
          to="/app/job"
          className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Job review
        </Link>
        <Link
          to="/app/studio"
          className="rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          Open studio
        </Link>
      </div>
    </motion.div>
  )
}
