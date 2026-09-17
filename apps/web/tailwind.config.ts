import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FBFAF8',
        surface: '#FFFFFF',
        ink: '#1C1B19',
        muted: '#6E6A63',
        hairline: '#E4E0D9',
        success: '#15803D',
        warning: '#A16207',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
        display: ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
      },
      maxWidth: {
        shell: '1560px',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
