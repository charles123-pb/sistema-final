export const environment = {
  production: false,
  // Desarrollo usa el mismo proyecto remoto que ya contiene usuarios y migraciones.
  supabaseUrl: 'https://cnwnecyodyxoszvmfxuc.supabase.co',
  // Esta es la clave pública anon; las claves privilegiadas permanecen en Edge Functions.
  supabaseAnonKey: 'sb_publishable_BeBDf-Hh_5A6MyILCz6hPQ_rhYPr0X0',
  authEmailDomain: 'auth.dental-americana.invalid',
} as const;
