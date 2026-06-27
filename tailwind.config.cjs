module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        accent: '#00B894',
        glass: 'rgba(255,255,255,0.06)'
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}
