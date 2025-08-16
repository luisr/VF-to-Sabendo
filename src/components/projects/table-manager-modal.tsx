"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTableSettings, TaskStatus, Tag, Column } from "@/hooks/use-table-settings";
import { Trash2, PlusCircle, Copy, Edit, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface TableManagerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TableManagerModal({ isOpen, onOpenChange }: TableManagerModalProps) {
  const settings = useTableSettings();
  const { toast } = useToast();

  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#808080");
  const [newTagName, setNewTagName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<Column['type']>("text");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");
  const [editingColumnType, setEditingColumnType] = useState<Column['type']>("text");

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await settings.addStatus({ name: newStatusName, color: newStatusColor });
    setNewStatusName("");
    setNewStatusColor("#808080");
    toast({ title: "Status adicionado!" });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await settings.addTag({ name: newTagName });
    setNewTagName("");
    toast({ title: "Etiqueta adicionada!" });
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    settings.addColumn(newColumnName, newColumnType);
    setNewColumnName("");
    toast({ title: "Coluna adicionada com sucesso!" });
  };

  const handleColumnVisibilityChange = (columnId: string, checked: boolean) => {
    const newVisible = checked
      ? [...settings.visibleColumns, columnId]
      : settings.visibleColumns.filter(id => id !== columnId);
    settings.setVisibleColumns(newVisible);
  };

  const handleStartEditing = (column: Column) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
    setEditingColumnType(column.type);
  };

  const handleConfirmEdit = () => {
    if (editingColumnId && editingColumnName.trim()) {
      settings.updateColumn(editingColumnId, editingColumnName, editingColumnType);
      setEditingColumnId(null);
      setEditingColumnName("");
      toast({ title: "Coluna atualizada com sucesso!" });
    }
  };

  const handleDuplicateColumn = (columnId: string) => {
      console.warn("A função 'duplicateColumn' não foi implementada.", columnId);
      toast({ title: "Funcionalidade não implementada", description: "A duplicação de colunas ainda não foi desenvolvida.", variant: "destructive" });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Tabela</DialogTitle>
          <DialogDescription>Personalize status, etiquetas e a visibilidade das colunas da sua tabela.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="columns" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="tags">Etiquetas</TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <h4 className="font-semibold">Gerenciar Colunas</h4>
            <div className="grid grid-cols-1 gap-4">
                {/* Coluna de ID Fixa */}
                <div className="flex items-center justify-between opacity-70">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="col-id" checked={true} disabled={true} />
                        <Label htmlFor="col-id">ID da Tarefa</Label>
                    </div>
                    <div className="flex items-center">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Esta coluna é obrigatória e não pode ser ocultada.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Colunas personalizáveis */}
                {settings.columns.map(col => (
                    <div key={col.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id={col.id} 
                                checked={settings.visibleColumns.includes(col.id)}
                                onCheckedChange={(checked) => handleColumnVisibilityChange(col.id, !!checked)}
                            />
                            {editingColumnId === col.id ? (
                                <Input 
                                    value={editingColumnName}
                                    onChange={(e) => setEditingColumnName(e.target.value)}
                                    onBlur={handleConfirmEdit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
                                    autoFocus
                                />
                            ) : (
                                <Label htmlFor={col.id}>{col.name}</Label>
                            )}
                        </div>
                        <div className="flex items-center">
                           {editingColumnId === col.id ? (
                                <Select value={editingColumnType} onValueChange={(value) => setEditingColumnType(value as Column['type'])}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texto</SelectItem>
                                        <SelectItem value="number">Número</SelectItem>
                                        <SelectItem value="date">Data</SelectItem>
                                        <SelectItem value="progress">Progresso</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Label className="text-sm text-muted-foreground w-[120px] text-right">{col.type}</Label>
                            )}
                            {editingColumnId === col.id ? (
                                <Button variant="ghost" size="icon" onClick={handleConfirmEdit}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={() => handleStartEditing(col)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicateColumn(col.id)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => settings.deleteColumn(col.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t">
                <Input placeholder="Nova coluna..." value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
                <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as Column['type'])}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                        <SelectItem value="progress">Progresso</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAddColumn}><PlusCircle className="h-4 w-4 mr-2"/>Adicionar</Button>
            </div>
          </TabsContent>

          <TabsContent value="status" className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <h4 className="font-semibold">Gerenciar Status</h4>
            {settings.statuses.map(status => (
                <div key={status.id} className="flex items-center gap-2">
                    <Input type="color" defaultValue={status.color || '#808080'} onChange={(e) => settings.updateStatus(status.id, { color: e.target.value })} className="w-14 p-1"/>
                    <Input defaultValue={status.name || ''} onBlur={(e) => settings.updateStatus(status.id, { name: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => settings.deleteStatus(status.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
            ))}
            <div className="flex items-center gap-2 pt-4 border-t">
                <Input type="color" value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} className="w-14 p-1"/>
                <Input placeholder="Novo status..." value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} />
                <Button onClick={handleAddStatus}><PlusCircle className="h-4 w-4 mr-2"/>Adicionar</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="tags" className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
             <h4 className="font-semibold">Gerenciar Etiquetas</h4>
             {settings.tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2">
                    <Input defaultValue={tag.name || ''} onBlur={(e) => settings.updateTag(tag.id, { name: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => settings.deleteTag(tag.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
             ))}
             <div className="flex items-center gap-2 pt-4 border-t">
                <Input placeholder="Nova etiqueta..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                <Button onClick={handleAddTag}><PlusCircle className="h-4 w-4 mr-2"/>Adicionar</Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
