/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff00ff',
          cyan: '#00ffff',
          green: '#39ff14',
          yellow: '#ffff00',
          orange: '#ff6600',
          purple: '#bf00ff',
          red: '#ff0040',
          blue: '#0080ff'
        },
        tekosin: {
          primary: '#ff00ff',
          secondary: '#00ffff',
          accent: '#39ff14',
          dark: '#0a0a1a',
          darker: '#050510',
          card: '#111128',
          border: '#2a2a4a'
        }
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'explosion': 'explosion 0.8s ease-out'
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff' },
          '50%': { boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' }
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #ff00ff, 0 0 10px #ff00ff' },
          '100%': { boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        explosion: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        }
      },
      backgroundSize: {
        '200%': '200% 200%'
      }
    }
  },
  plugins: []
};
