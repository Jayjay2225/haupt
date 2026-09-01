import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Design-Tokens sind die einzige Farbquelle — Hex-Werte gehören in tokens.css.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: 'Keine Hex-Farben im Code — Farben kommen aus tokens.css (var(--farbe-…)).',
        },
      ],
    },
  },
);
