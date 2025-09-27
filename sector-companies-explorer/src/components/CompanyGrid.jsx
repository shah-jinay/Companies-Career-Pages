// components/CompanyGrid.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, MapPin, Link, Building2, Wifi, WifiOff } from 'lucide-react'
import { buildCareersSearchUrl } from '../utils/buildCareersSearchUrl.js'

export function CompanyGrid({ items, softwareOnly = false, roleQuery = 'software' }) {
  if (!items?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] backdrop-blur-sm p-12 text-center"
      >
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
          <Building2 size={32} className="text-[hsl(var(--muted-foreground))]" />
        </div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No companies found</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your search or selecting a different sector.</p>
      </motion.div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((c, index) => (
        <motion.article
          key={c.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -4 }}
          className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-xl leading-tight text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors duration-200">
                  {c.name}
                </h3>
                {c.sizeMeta?.label && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-orange-200/70 bg-orange-100/60 px-3 py-1 text-xs font-medium text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/10 dark:text-orange-300">
                    <Building2 size={12} />
                    {c.sizeMeta.label}
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                c.remote
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {c.remote ? <Wifi size={12} /> : <WifiOff size={12} />}
                {c.remote ? 'Remote' : 'Onsite'}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <MapPin size={16} className="text-[hsl(var(--primary))]" />
                {c.hq}
              </p>

              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <Link size={14} className="text-[hsl(var(--accent))]" />
                {c.sector}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
              <a
                className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-colors duration-200 group/link"
                href={softwareOnly
                  ? buildCareersSearchUrl(c.careers, { query: 'Software Engineer', location: 'United States', levels: ['EARLY','MID'], sortBy: 'date' })
                  : c.careers}
                target="_blank"
                rel="noreferrer noopener"
              >
                {softwareOnly ? 'View Software Roles' : 'View Careers'}
                <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform duration-200" />
              </a>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
