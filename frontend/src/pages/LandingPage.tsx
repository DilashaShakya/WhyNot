import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
          Career clarity
        </p>
        <h1 className="mt-6 font-semibold leading-[1.08] tracking-tight text-neutral-900 dark:text-neutral-50">
          Understand how your resume reads against a real job description—before you hit submit.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          WhyNot pairs your resume with the role you are pursuing so you can spot gaps, mismatches, and
          narratives to strengthen.{' '}
          <span className="text-neutral-400 dark:text-neutral-500">
            Analysis features are coming next—this build focuses on account, structure, and flow.
          </span>
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="inline-flex rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="inline-flex rounded-md border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
