import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FDF8F1',
        surface: '#FFFFFF',
        sand: '#F4E7D5',
        ink: '#231C16',
        muted: '#7A6E63',
        hairline: '#E8DECF',
        clay: {
          DEFAULT: '#C4553A',
          soft: '#F8E3DA',
          deep: '#9E3F28',
        },
        ochre: {
          DEFAULT: '#DFA02C',
          soft: '#FBEDD2',
        },
        sage: {
          DEFAULT: '#7F9471',
          soft: '#E8EEE2',
        },
        success: '#3F7A52',
        warning: '#B07D20',
        error: '#B3402F',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em' }],
        display: [
          'clamp(3rem, 7.5vw, 6rem)',
          { lineHeight: '0.98', letterSpacing: '-0.025em' },
        ],
        section: [
          'clamp(2.25rem, 4.5vw, 3.75rem)',
          { lineHeight: '1.04', letterSpacing: '-0.02em' },
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
    },
  },
  plugins: [],
};

export default config;
