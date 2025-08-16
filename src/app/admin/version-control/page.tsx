
import PageHeader from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const versionHistory = [
    { 
        version: "v1.2.0", 
        date: "15/07/2024", 
        description: "Adicionado o painel de Super Admin com visão consolidada e menu de configurações.",
        tags: ["Funcionalidade", "Admin"]
    },
    { 
        version: "v1.1.5", 
        date: "10/07/2024", 
        description: "Correção de bug no cálculo da média de conclusão de tarefas no painel.",
        tags: ["Correção", "Painel"]
    },
     { 
        version: "v1.1.0", 
        date: "05/07/2024", 
        description: "Implementado o módulo de Ferramentas de IA, incluindo previsão de risco e assistente de criação de projetos.",
        tags: ["Funcionalidade", "IA"]
    },
    { 
        version: "v1.0.0", 
        date: "01/07/2024", 
        description: "Lançamento inicial da plataforma com funcionalidades de gerenciamento de projetos (Tabela, Gantt, Kanban).",
        tags: ["Lançamento"]
    },
];

export default function VersionControlPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Gestão de Versão" />
      <Card>
        <CardHeader>
          <CardTitle>Controle de Versão</CardTitle>
          <CardDescription>
            Visualize o histórico de alterações e gerencie as versões da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {versionHistory.map((item) => (
              <div key={item.version} className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    <div className="flex-1 w-px bg-border" />
                </div>
                <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.version}</h4>
                        <span className="text-xs text-muted-foreground">- {item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
