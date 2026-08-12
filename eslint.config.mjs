import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
 
const eslintConfig = defineConfig([
  ...nextVitals,
  { settings: { react: { version: '19.2.0' } } },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
 
export default eslintConfig;