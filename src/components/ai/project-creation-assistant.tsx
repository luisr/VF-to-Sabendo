
"use client";

import { useState, useEffect } from "react";
import { projectCreationAssistant, type ProjectCreationAssistantOutput } from "@/ai/flows/project-creation-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, CheckCircle, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "../ui/input";

export default function ProjectCreationAssistant() {
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProjectCreationAssistantOutput | null>(null);
  const [editableTasks, setEditableTasks] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (result) {
        setEditableTasks(result.suggestedTasks);
    }
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await projectCreationAssistant({ goal, details });
      setResult(response);
    } catch (error) {
      console.error("AI Project Creation Error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o plano do projeto. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...editableTasks];
    newTasks[index] = value;
    setEditableTasks(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    setEditableTasks(editableTasks.filter((_, i) => i !== index));
  }

  const handleAddTask = () => {
    setEditableTasks([...editableTasks, "Nova tarefa"]);
  }

  const handleCreateProject = () => {
    if (!result) return;
    
    const query = new URLSearchParams({
        aiAssisted: "true",
        projectName: goal.substring(0, 50), // Limita o nome
        tasks: JSON.stringify(editableTasks.filter(t => t.trim() !== '')), // Envia tarefas editadas
    });

    const destination = pathname.includes('/admin') ? '/admin/projects' : '/projects';
    router.push(`${destination}?${query.toString()}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Criação de Projeto Assistida por IA</CardTitle>
          <CardDescription>
            Descreva seu projeto e nossa IA o ajudará a elaborar um plano inicial, incluindo tarefas, cronograma e complexidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="goal">Objetivo do Projeto</Label>
            <Textarea
              id="goal"
              placeholder="Ex: Lançar um novo site de marketing para o terceiro trimestre."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="details">Detalhes Adicionais</Label>
            <Textarea
              id="details"
              placeholder="Ex: O site deve incluir um blog, formulário de contato e ser otimizado para dispositivos móveis."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !goal}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Gerar Plano
          </Button>
        </CardFooter>
      </form>

      {result && (
        <div className="p-6 pt-0">
          <h3 className="text-lg font-semibold mb-4">Plano Gerado por IA</h3>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Tarefas Sugeridas (Editável)</CardTitle>
                     <Button variant="outline" size="sm" onClick={handleAddTask}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {editableTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input 
                            value={task}
                            onChange={(e) => handleTaskChange(index, e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTask(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estimativa de Cronograma</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{result.timelineEstimate}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Avaliação de Complexidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{result.complexityAssessment}</p>
                </CardContent>
              </Card>
            </div>
             <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setResult(null)}>Descartar</Button>
                <Button onClick={handleCreateProject}><CheckCircle className="mr-2 h-4 w-4"/>Criar Projeto com este Plano</Button>
             </div>
          </div>
        </div>
      )}
    </Card>
  );
}
