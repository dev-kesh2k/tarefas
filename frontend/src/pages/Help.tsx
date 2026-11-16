import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Logo, PageHeader } from '../ui';

const FAQ = [
  ['Como crio uma tarefa?', 'Toque no botão + (barra inferior no celular ou "Nova tarefa" no menu lateral). Só o título é obrigatório; data, horário, prioridade, projeto, responsável e checklist são opcionais.'],
  ['Como marco uma tarefa como concluída?', 'Toque no círculo à esquerda da tarefa em qualquer lista, ou abra a tarefa e use "Marcar como concluída". Para desfazer, toque de novo ou use "Reabrir tarefa".'],
  ['Como funcionam os lembretes?', 'Tarefas com data e horário de início geram um aviso em Notificações 15 minutos antes de começar (para quem criou e para o responsável).'],
  ['Posso atribuir tarefas a outras pessoas?', 'Sim. Qualquer usuário cadastrado no app aparece em "Atribuir a". A pessoa recebe uma notificação e vê a tarefa na lista dela; ela pode concluir e usar o checklist, mas só quem criou pode editar ou excluir.'],
  ['O que acontece ao excluir um projeto?', 'As tarefas do projeto não são apagadas: elas apenas ficam sem projeto.'],
  ['Como filtro minhas tarefas?', 'Na tela Tarefas use as abas Todas, Pendentes e Concluídas, a lupa para buscar pelo título e o ícone de filtros para prioridade, categoria e projeto.'],
  ['Como altero minha senha?', 'Perfil → Informações da conta → Alterar senha.'],
];

export default function Help() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Ajuda e perguntas frequentes" back />
      <div className="space-y-2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card group p-0">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-3 px-4 font-semibold">
              <span className="min-w-0 flex-1">{q}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-[#94a3b8] transition group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-sm text-[#475569]">{a}</p>
          </details>
        ))}
      </div>

      <section id="sobre" className="card mt-6 flex flex-col items-center p-6 text-center">
        <Logo size={56} />
        <h2 className="mt-3 text-lg font-bold">Tarefas</h2>
        <p className="text-sm text-[#64748b]">Versão 1.0.0</p>
        <p className="mt-3 max-w-sm text-sm text-[#475569]">
          Organize tarefas, projetos e prazos em um só lugar. Seus dados ficam salvos com segurança no servidor e sincronizados em todos os seus
          dispositivos.
        </p>
      </section>
    </div>
  );
}
