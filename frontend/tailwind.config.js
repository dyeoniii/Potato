/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 퍼플 포인트
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
        },
        // 네이비 텍스트 / 라이트 그레이 면
        ink: {
          50: '#f6f7fb',
          100: '#eef0f6',
          200: '#e1e5ef',
          300: '#cbd1e1',
          400: '#9aa3bc',
          500: '#6b7593',
          600: '#4d5877',
          700: '#34406a',
          800: '#1f2a52',
          900: '#0f1b3d',
        },
      },
    },
  },
  plugins: [],
};
