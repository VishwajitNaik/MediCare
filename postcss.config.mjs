const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
  
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // animation: {
      //   'fade-in': 'fadeIn 0.3s ease-out',
      //   'slide-up': 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      //   'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      //   'slideInRight': 'slideInRight 0.5s ease-out',
      //   'fadeInUp': 'fadeInUp 0.6s ease-out',
      //   'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      //   'bounce-slow': 'bounce 3s infinite',
      //   'progressBar': 'progressBar 2s linear forwards',
      //   'shake': 'shake 0.5s ease-in-out',
      // },
            colors: {
        // Medical Theme Colors
        'medical-primary': '#10b981',
        'medical-dark': '#059669',
        'medical-light': '#d1fae5',
        'medical-border': '#d1fae5',
        'medical-bg': '#ecfdf5',
        'medical-success': '#22c55e',
        'medical-warning': '#f59e0b',
        'medical-danger': '#ef4444',
        'medical-info': '#3b82f6',
      },
            animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'progress-bar': 'progressBar 2s linear forwards',
        'shake': 'shake 0.5s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'new-item': 'newItemPulse 2s infinite',
        'pulse-medical': 'pulse-medical 2s infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
                slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        newItemPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
        },
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
};

export default config;
