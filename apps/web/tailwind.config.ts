import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FCF9F4',
        surface: '#FFFFFF',
        sand: '#EDE7DC',
        ink: '#1B2422',
        muted: '#6C7471',
        hairline: '#DFD9CD',
        brand: {
          DEFAULT: '#064530',
          soft: '#D9EAE0',
          deep: '#032A1C',
        },
        highlight: {
          DEFAULT: '#DFA02C',
          soft: '#FBEDD2',
        },
        support: {
          DEFAULT: '#B8604A',
          soft: '#F7E4DD',
        },
        success: '#3F7A52',
        warning: '#B07D20',
        error: '#B3402F',
        status: {
          action: '#7A5410',
          'action-soft': '#FBEDD2',
          progress: '#1F4A7A',
          'progress-soft': '#E3EBF5',
          done: '#063F29',
          'done-soft': '#D9EAE0',
          problem: '#8E2F21',
          'problem-soft': '#F6DFD9',
          closed: '#3E4643',
          'closed-soft': '#EDE7DC',
        },
      },
      fontFamily: {
        sans: ['var(--font-brand)', 'system-ui', 'sans-serif'],
        display: ['var(--font-brand)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.01em',
        tighter: '-0.02em',
      },
      fontSize: {
        label: ['0.8125rem', { lineHeight: '1', letterSpacing: '0.03em' }],
        display: [
          'clamp(3rem, 7.5vw, 6rem)',
          { lineHeight: '0.98', letterSpacing: '-0.01em' },
        ],
        section: [
          'clamp(2.25rem, 4.5vw, 3.75rem)',
          { lineHeight: '1.04', letterSpacing: '-0.005em' },
        ],
        heading: [
          'clamp(2rem, 4vw, 3.25rem)',
          { lineHeight: '1.05', letterSpacing: '-0.03em' },
        ],
        title: [
          'clamp(1.875rem, 3vw, 2.25rem)',
          { lineHeight: '1.15', letterSpacing: '-0.01em' },
        ],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        lift: '0 24px 60px -28px rgba(62, 40, 26, 0.35)',
        card: '0 10px 30px -18px rgba(62, 40, 26, 0.30)',
      },
      maxWidth: {
        shell: '1480px',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
