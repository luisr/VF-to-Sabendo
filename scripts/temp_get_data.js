#!/usr/bin/env node
require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

/**
 * Script utilitário para buscar dados no Supabase.
 *
 * Uso:
 *   1. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu arquivo .env.local.
 *   2. Execute: `node scripts/temp_get_data.js`
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: As variáveis de ambiente do Supabase não estão definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getData() {
  try {
    console.log('--- BUSCANDO USUÁRIOS ---');
    const { data: users, error: usersError } = await supabase.rpc('get_all_users');
    if (usersError) throw usersError;
    console.log(users);

    console.log('\n--- BUSCANDO PROJETOS ---');
    // Nota: Esta chamada irá falhar sem um JWT, mas vamos tentar.
    // Se falhar, pediremos o JWT ao usuário.
    const { data: projects, error: projectsError } = await supabase.rpc('get_my_projects_details');
    if (projectsError) {
      console.error('Falha ao buscar projetos (Isto é esperado sem autenticação). Erro:', projectsError.message);
      console.log('\nAVISO: A busca de projetos requer autenticação.');
    } else {
      console.log(projects);
    }
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

getData();
