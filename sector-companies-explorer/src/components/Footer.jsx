// components/Footer.jsx
import React from 'react'
import { Heart, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] backdrop-blur-sm mt-16">
      <div className="container max-w-7xl py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
          <Heart size={14} className="text-red-500" />
          Curated list of career pages to help you focus your search.
        </p>
        <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span>Data sourced from public listings</span>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-[hsl(var(--primary))] transition-colors duration-200"
          >
            <Github size={14} />
            Contribute
          </a>
        </div>
      </div>
    </footer>
  )
}
