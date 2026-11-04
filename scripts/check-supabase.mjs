import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/environments/environment.ts', import.meta.url), 'utf8');
const url = process.env.SUPABASE_URL ?? source.match(/supabaseUrl:\s*'([^']+)'/)?.[1];
const key = process.env.SUPABASE_PUBLIC_KEY ?? source.match(/supabaseAnonKey:\s*'([^']+)'/)?.[1];

if (!url || !key) throw new Error('Falta la URL o la clave pública de Supabase.');
const project = new URL(url);
if (project.protocol !== 'https:' && project.hostname !== 'localhost' && project.hostname !== '127.0.0.1') {
  throw new Error('La conexión remota debe usar HTTPS.');
}
if (project.username || project.password || project.search || project.hash) {
  throw new Error('La URL debe identificar únicamente el proyecto Supabase.');
}
if (key.startsWith('sb_secret_')) throw new Error('Utiliza una clave pública, nunca una clave secreta.');
if (key.startsWith('eyJ')) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('El frontend requiere una clave pública con rol anon.');
}

for (const [name, path] of [['Auth (clave pública)', '/auth/v1/settings'], ['PostgREST', '/rest/v1/']]) {
  try {
    const response = await fetch(new URL(path, project), {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15_000),
    });
    console.log(`${name}: HTTP ${response.status}`);
    const errorBody = !response.ok ? await response.json().catch(() => ({})) : {};
    if (name === 'PostgREST' && response.status === 401 && errorBody.message === 'Secret API key required') {
      console.log('La raíz de PostgREST requiere una clave secreta; este resultado no invalida la clave pública. Los flujos de datos autenticados requieren verificación aparte.');
      continue;
    }
    if (!response.ok) {
      process.exitCode = 1;
      if (response.status === 401) console.error('Comprueba que la clave pública pertenece a la URL configurada y sigue vigente.');
    }
    await response.body?.cancel();
  } catch {
    console.error(`${name}: no se pudo completar la comprobación de conectividad.`);
    process.exitCode = 1;
  }
}
