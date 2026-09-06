const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['components/InspectionForm.tsx'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  external: ['react', 'react-dom', '@supabase/supabase-js', '@yudiel/react-qr-scanner'],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test')
  },
  outfile: 'dist/test_form.mjs'
});
console.log('Build OK');
