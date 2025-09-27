// App.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { Header } from './components/Header.jsx'
import { Footer } from './components/Footer.jsx'
import { SectorSelect } from './components/SectorSelect.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { CompanyGrid } from './components/CompanyGrid.jsx'
import { getSectors, getCompanies } from './data'
import { getCompanySizeMeta } from './data/companySize.js'
import { exportCsv } from './utils/exportCsv.js'
import { Moon, Sun } from 'lucide-react'

const ALL_SECTORS = 'All Sectors'

export default function App() {
  const sectors = [ALL_SECTORS, ...getSectors()]
  const all = getCompanies()
  const sizeMeta = useMemo(() => {
    return new Map(all.map((company, index) => [company.name, getCompanySizeMeta(company, index)]))
  }, [all])

  const [sector, setSector] = useState(ALL_SECTORS)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [softwareOnly, setSoftwareOnly] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  // Debounce search so UI feels snappier with large lists
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 180)
    return () => clearTimeout(id)
  }, [query])

  // Theme management
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const filtered = useMemo(() => {
    const base = all
      .filter(c => (sector === ALL_SECTORS ? true : c.sector === sector))
      .filter(c => (remoteOnly ? c.remote : true))
      .filter(c => {
        if (!debouncedQuery) return true
        const q = debouncedQuery
        return (
          c.name.toLowerCase().includes(q) ||
          c.hq.toLowerCase().includes(q) ||
          (c.tags?.join(' ').toLowerCase().includes(q))
        )
      })
      .filter(c => {
        if (!softwareOnly) return true
        const keywords = ['software', 'engineer', 'developer', 'sde', 'dev', 'backend', 'frontend', 'fullstack']
        const text = `${c.name} ${c.tags?.join(' ')}`.toLowerCase()
        return keywords.some(k => text.includes(k))
      })

    const annotated = base.map(company => {
      const meta = sizeMeta.get(company.name)
      return meta ? { ...company, sizeMeta: meta } : company
    })

    if (sector === ALL_SECTORS) {
      return annotated.slice().sort((a, b) => {
        const scoreDiff = (b.sizeMeta?.score ?? 0) - (a.sizeMeta?.score ?? 0)
        if (scoreDiff !== 0) return scoreDiff
        return a.name.localeCompare(b.name)
      })
    }

    return annotated
  }, [all, sector, debouncedQuery, remoteOnly, softwareOnly, sizeMeta])

  const handleExport = () => exportCsv(filtered)

  return (
  <div className={`min-h-screen transition-colors duration-300 bg-[hsl(var(--background))]`}>
      <Header />

      <main className="container max-w-7xl px-4 py-8 md:py-12">
        {/* Controls Card */}
  <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-1">
              {/* Sector selector stays left and prominent */}
              <div className="md:flex-shrink-0">
                <SectorSelect value={sector} onChange={setSector} sectors={sectors} />
              </div>

              {/* Divider dot on md+ */}
              <span className="hidden md:block h-1 w-1 rounded-full bg-border mx-4" />

              {/* Search */}
              <div className="w-full md:w-80 md:flex-1 md:max-w-md">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search companies, HQ, tags"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 md:flex-shrink-0">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Filters */}
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={softwareOnly}
                  onChange={e => setSoftwareOnly(e.target.checked)}
                  className="accent-[hsl(var(--primary))] w-4 h-4 rounded"
                />
                Software Roles Only
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={e => setRemoteOnly(e.target.checked)}
                  className="accent-[hsl(var(--primary))] w-4 h-4 rounded"
                />
                Remote Only
              </label>

              {/* Export */}
              <button
                onClick={handleExport}
                className="text-sm px-3 py-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:bg-[hsl(var(--muted))] active:scale-[0.99] transition"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Status row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              Displaying <span className="font-semibold text-[hsl(var(--foreground))]">{filtered.length}</span> companies
              {sector === ALL_SECTORS ? (
                <span> across all sectors</span>
              ) : (
                <> in <span className="font-medium text-[hsl(var(--foreground))]">{sector}</span></>
              )}
              {remoteOnly ? <span> · remote friendly</span> : null}
              {softwareOnly ? <span> · software roles</span> : null}
            </p>
          </div>
        </section>

        {/* Grid or empty state */}
        {filtered.length > 0 ? (
          <div className="mt-6">
            <CompanyGrid items={filtered} softwareOnly={softwareOnly} roleQuery="software" />
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              onClear={() => {
                setQuery('')
                setRemoteOnly(false)
              }}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

/** Simple empty state */
function EmptyState({ onClear }) {
  return (

  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] backdrop-blur-sm p-10 text-center">
  <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.5 6a1.5 1.5 0 1 1 3 0v4.5H18a1.5 1.5 0 1 1 0 3h-4.5V18a1.5 1.5 0 1 1-3 0v-4.5H6a1.5 1.5 0 1 1 0-3h4.5V6Z"/>
        </svg>
      </div>
  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">No matches found</h3>
  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try clearing filters or changing your search.</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={onClear}
          className="text-sm px-3 py-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:bg-[hsl(var(--muted))] transition-colors duration-200"
        >
          Clear filters
        </button>
      </div>
    </div>
  )
}
