
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, FilePieChart, LineChart } from "lucide-react";

interface AddWidgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (widget: any) => void;
  widgetType: "kpi" | "chart";
}

export default function AddWidgetModal({
  isOpen,
  onOpenChange,
  onAddWidget,
  widgetType,
}: AddWidgetModalProps) {
  const [widgetData, setWidgetData] = useState({
    name: "",
    type: widgetType,
    dataSource: "tasks",
    metric: "count",
    groupBy: "status",
    chartType: "bar",
  });

  useEffect(() => {
    setWidgetData(prev => ({...prev, type: widgetType}));
  }, [widgetType]);

  const handleInputChange = (field: string, value: any) => {
    setWidgetData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (widgetData.name) {
      onAddWidget(widgetData);
      onOpenChange(false);
      // Reset form
      setWidgetData({
        name: "",
        type: widgetType,
        dataSource: "tasks",
        metric: "count",
        groupBy: "status",
        chartType: "bar",
      });
    }
  };
  
  const title = widgetType === 'kpi' ? 'Adicionar Novo KPI' : 'Adicionar Novo Gráfico';
  const description = widgetType === 'kpi'
    ? "Configure um novo Indicador-Chave de Desempenho para seu painel."
    : "Crie um novo gráfico para visualizar seus dados de projeto.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={widgetData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="col-span-3"
              placeholder={widgetType === 'kpi' ? "Ex: Tarefas Atrasadas" : "Ex: Tarefas por Responsável"}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataSource" className="text-right">
              Fonte de Dados
            </Label>
            <Select
              value={widgetData.dataSource}
              onValueChange={(value) => handleInputChange("dataSource", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">Tarefas</SelectItem>
                <SelectItem value="projects" disabled>Projetos (em breve)</SelectItem>
                <SelectItem value="budgets" disabled>Orçamentos (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">
              Métrica
            </Label>
            <Select
              value={widgetData.metric}
              onValueChange={(value) => handleInputChange("metric", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Contagem de Itens</SelectItem>
                <SelectItem value="sum" disabled>Soma de Valores (em breve)</SelectItem>
                <SelectItem value="avg" disabled>Média de Valores (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {widgetType === 'chart' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groupBy" className="text-right">
                  Agrupar Por
                </Label>
                <Select
                  value={widgetData.groupBy}
                  onValueChange={(value) => handleInputChange("groupBy", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Prioridade</SelectItem>
                    <SelectItem value="assignee">Responsável</SelectItem>
                    <SelectItem value="project">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="chartType" className="text-right">
                    Tipo de Gráfico
                 </Label>
                 <Select
                    value={widgetData.chartType}
                    onValueChange={(value) => handleInputChange("chartType", value)}
                 >
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bar">
                            <div className="flex items-center gap-2"><BarChart className="h-4 w-4"/> Barras</div>
                        </SelectItem>
                        <SelectItem value="pie">
                            <div className="flex items-center gap-2"><FilePieChart className="h-4 w-4"/> Pizza</div>
                        </SelectItem>
                         <SelectItem value="line">
                            <div className="flex items-center gap-2"><LineChart className="h-4 w-4"/> Linha</div>
                        </SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleSubmit} disabled={!widgetData.name}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
