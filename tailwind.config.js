/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 1. Primary: Deep Academic Blue (#2563EB)
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          tint: '#EFF6FF',
          dark: '#1E40AF',
        },
        // Giữ alias brand map sang Deep Academic Blue để tương thích code cũ
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },

        // 2. AI Accent: Electric Violet (#7C3AED)
        ai: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          tint: '#F5F3FF',
        },

        // 3. Status Colors
        status: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#EF4444',
          'danger-bg': '#FEF2F2',
        },

        // 4. Certificate Badges (IELTS, TOEIC, VSTEP)
        cert: {
          ielts: {
            bg: '#FEE2E2',
            text: '#B91C1C',
            border: '#FECACA',
          },
          toeic: {
            bg: '#EFF6FF',
            text: '#1D4ED8',
            border: '#BFDBFE',
          },
          vstep: {
            bg: '#ECFDF5',
            text: '#047857',
            border: '#A7F3D0',
          },
        },

        // 5. Dark Theme & Surface Tokens
        navy: {
          900: '#0F172A', // Nền Dark Sidebar & Hero Column
          800: '#1E293B',
          700: '#334155',
        },
        canvas: '#F8FAFC', // Nền Canvas chung
      },

      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },

      borderRadius: {
        card: '16px',      // Card/Surface border-radius chuẩn 16px
        input: '10px',     // Input & Button border-radius chuẩn 10px
      },

      boxShadow: {
        elevation: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'ai-glow': '0 0 25px -5px rgba(124, 58, 237, 0.35)',
      },

      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      },
    },
  },
  plugins: [],
};