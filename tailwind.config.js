/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.tsx',
    './components/**/*.tsx',
    './hooks/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-glow': '#60A5FA',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        'bg-base': '#080C14',
        'bg-surface': '#0D1421',
        'bg-elevated': '#111927',
        'bg-card': '#0F1A2E',
        'border-subtle': 'rgba(255,255,255,0.06)',
        'text-primary': '#F1F5F9',
        'text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-blue': '0 0 30px rgba(59,130,246,0.15)',
        'glow-sm': '0 0 15px rgba(59,130,246,0.10)',
        'glow-green': '0 0 20px rgba(16,185,129,0.15)',
        'glow-red': '0 0 20px rgba(239,68,68,0.15)',
        card: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
