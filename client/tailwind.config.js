/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx,cjs}", "./index.html"],
  theme: {
  	screens: {
  		sm: '640px',
  		md: '768px',
  		lg: '1024px',
  		xl: '1280px',
  		xxl: '1300px',
  		'2xl': '1536px'
  	},
  	extend: {
		  fontFamily: {
        cursive: ['"Pacifico"', 'cursive'],
		  script: ['"Dancing Script"', 'cursive'],

      },
  		screens: {
  			xxl: '1300px'
  		},
  		colors: {
  			midnight: '#080B16',
  			sapphire: '#111C2F',
  			aurora: '#1F2E4C',
        lilac: '#7C5CFC',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			teal: '#2DD4BF',
  			amber: '#FBBF24',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			'portfolio-gradient': 'radial-gradient(circle at 0% 0%, rgba(124,92,252,0.15), transparent 45%), radial-gradient(circle at 100% 0%, rgba(45,212,191,0.12), transparent 40%), linear-gradient(180deg, #080B16 0%, #111C2F 35%, #04060B 100%)',
  			'card-glow': 'linear-gradient(145deg, rgba(124,92,252,0.12), rgba(59,130,246,0.08))'
  		},
  		boxShadow: {
  			glow: '0 20px 45px -25px rgba(124,92,252,0.45)',
  			soft: '0 12px 30px -18px rgba(15,23,42,0.55)'
  		},
  		keyframes: {
  			flipY: {
  				'0%': {
  					transform: 'rotateY(0deg)'
  				},
  				'49%': {
  					transform: 'rotateY(179.9deg)'
  				},
  				'50%': {
  					transform: 'rotateY(180deg)'
  				},
  				'99%': {
  					transform: 'rotateY(359.9deg)'
  				},
  				'100%': {
  					transform: 'rotateY(360deg)'
  				}
  			}
  		},
  		animation: {
  			flipY: 'flipY 10s linear infinite'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
