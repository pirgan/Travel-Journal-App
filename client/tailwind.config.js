/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette
        terracotta:      '#C0622A',
        'terracotta-soft':'#F5EDE4',
        forest:          '#3D6B4F',
        sand:            '#F5E6C8',
        cream:           '#FDFAF5',

        // Warm ink scale (replaces cool grays)
        'ink-dark':      '#1C1714',
        'ink-mid':       '#3D3028',
        'ink-secondary': '#6B5E54',
        'ink-muted':     '#9C8E84',

        // Warm border scale
        'border-warm':   '#EDE0D4',
        'border-mid':    '#E8DDD4',
        'border-light':  '#D4C4B8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 4px 20px rgba(28, 23, 20, 0.06)',
        'card-hover': '0 8px 32px rgba(28, 23, 20, 0.10)',
        btn:   '0 4px 16px rgba(192, 98, 42, 0.19)',
      },
      fontSize: {
        '2xs': '11px',
      },
      lineHeight: {
        prose: '1.7',
      },
    },
  },
  plugins: [],
}
