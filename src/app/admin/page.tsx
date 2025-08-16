import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redireciona o usuário da rota /admin para a página principal do painel de admin.
  redirect('/admin/dashboard');
}
