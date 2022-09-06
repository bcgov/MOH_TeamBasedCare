module.exports = {
  mode: 'jit',
  purge: ['out/**/*.html, ./src/pages/**/*.tsx', './src/components/**/*.tsx'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['BCSans'],
    },
    extend: {
      colors: {
        bcYellowPrimary: '#FCBA19',
        bcBlack: '#313132',
        bcDeepBlack: '#272833',
        bcGray: '#606060',
        bcGrayDisabled: '#808080',
        bcGrayDisabled2: '#585858',
        bcGrayInput: '#F5F5F5',
        bcGrayLabel: '#574F5A',
        bcLightGray: '#F2F2F2',
        bcBluePrimary: '#003366',
        bcBlueBorder: '#00478F',
        bcBlueBar: 'rgba(139, 199, 255, 0.2)',
        bcBlueAccent: '#38598A',
        bcBlueLink: '#1A5A96',
        bcBlueIndicator: '#0053A4',
        bcBrown: '#6C4A00',
        bcRedError: '#D8292F',
        bcDarkRed: '#d02c2f',
        bcGreenSuccess: '#256c35',
        bcGreenHiredText: '#2E8540',
        bcGreenHiredContainer: 'rgba(46, 133, 64, 0.2)',
        bcYellowWarning: '#F5A623',
        bcYellowBanner: '#EED202',
        bcLightBackground: '#E5E5E5',
        bcLightBlueBackground: '#D9EAF7',
        bcOrange: '#F6A622',
        bcDisabled: '#CFCFCF',
        bcYellowCream: '#F9F1C6',
        bcYellowCreamStroke: '#FAEBCC',
        bcDarkBlue: '#001a33',
        bcActiveBlue: '#003265',
      },
      fontSize: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      ringOffsetWidth: {
        10: '10px',
      },
      boxShadow: {
        xs: '0px 1px 0px rgba(0, 0, 0, 0.1)',
        '2xl': '0 4px 16px 0 rgba(35,64,117,0.3)',
      },
      minWidth: {
        5: '1.25rem',
      },
      width: {
        layout: '1140px',
        xl: '1215px',
      },
      letterSpacing: {
        widest: '.3em',
        wider: '.1em',
      },
      borderWidth: {
        10: '10px',
      },
      padding: {
        0.5: '2px',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      backgroundColor: ['disabled'],
      textColor: ['disabled'],
      backgroundColor: ['even'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
