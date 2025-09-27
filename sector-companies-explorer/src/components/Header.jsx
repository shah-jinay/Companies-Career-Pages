// components/Header.jsx
import React from 'react'
import { BriefcaseBusiness } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-[hsl(var(--background)/0.92)] backdrop-blur-lg border-b border-[hsl(var(--border)/0.6)]">
      <div className="container max-w-7xl py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-xl blur opacity-25"></div>
            <div className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-2">
              <BriefcaseBusiness size={24} className="text-[hsl(var(--primary))]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Sector Explorer
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Find high-signal career pages faster
            </p>
          </div>
        </div>
        <span className="hidden sm:inline text-xs font-medium tracking-wide text-[hsl(var(--muted-foreground))] uppercase">Updated library of companies</span>
      </div>
    </header>
  )
}
