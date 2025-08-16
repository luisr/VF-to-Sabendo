"use client";
import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Camera } from 'lucide-react';
import { BurndownChart, SCurveChart } from '@/app/(app)/bi/page';
import type { ProjectAnalysis, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

// Tipos de dados
type ChangeHistoryItem = { task_name: string; changed_field: 'start_date' | 'end_date'; old_value: string; new_value: string; justification: string; changed_at: string; author_name: string; };
export type ReportData = { project_details: Project; analysis: ProjectAnalysis; change_history: ChangeHistoryItem[]; };
export type AIReportAnalysis = { reportTitle: string; executiveSummary: string; kpiAnalysis: string; taskAnalysis: string; criticalPathAnalysis: string; chartInsight: string; justificationAnalysis: string; recommendations: string; };
interface ProjectReportModalProps { isOpen: boolean; onOpenChange: (open: boolean) => void; reportData: ReportData | null; aiAnalysis: AIReportAnalysis | null; isLoading: boolean; }

const ReportSection = ({ title, content }: { title: string, content: string }) => (
  <Card className="report-card">
    <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
    <CardContent className="prose prose-sm max-w-none"><ReactMarkdown components={{ img: () => null }}>{content}</ReactMarkdown></CardContent>
  </Card>
);

export default function ProjectReportModal({ isOpen, onOpenChange, reportData, aiAnalysis, isLoading }: ProjectReportModalProps) {
  const { toast } = useToast();
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [chartImages, setChartImages] = useState<{ burndown: string | null; sCurve: string | null }>({ burndown: null, sCurve: null });

  const burndownRef = useRef<HTMLDivElement>(null);
  const sCurveRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!burndownRef.current || !sCurveRef.current) {
      toast({ title: 'Erro', description: 'Gráficos não estão prontos para impressão.', variant: 'destructive' });
      return;
    }
    setIsPreparingPrint(true);
    try {
      const [burndownImg, sCurveImg] = await Promise.all([
        toPng(burndownRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' }),
        toPng(sCurveRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' })
      ]);
      setChartImages({ burndown: burndownImg, sCurve: sCurveImg });
    } catch (error) {
      console.error('Erro ao gerar imagens dos gráficos:', error);
      toast({ title: 'Erro ao preparar impressão', variant: 'destructive' });
      setIsPreparingPrint(false);
    }
  };

  useEffect(() => {
    if (chartImages.burndown && chartImages.sCurve) {
      window.print();
    }
  }, [chartImages]);
  
  useEffect(() => {
    const handleAfterPrint = () => {
        setChartImages({ burndown: null, sCurve: null });
        setIsPreparingPrint(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    if (!isOpen) {
      setChartImages({ burndown: null, sCurve: null });
      setIsPreparingPrint(false);
    }
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <style jsx global>{`
          .print-only-chart { display: none; }
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body * { visibility: hidden; }
            .printable-report, .printable-report * { visibility: visible; }
            .printable-report { position: absolute; left: 0; top: 0; width: 100%; height: auto !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; }
            .report-scroll-area, .report-scroll-area > div { overflow: visible !important; height: auto !important; }
            .report-footer, .no-print { display: none; }
            .report-card, .chart-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; page-break-inside: avoid !important; }
            .screen-only-chart { display: none !important; }
            .print-only-chart { display: block !important; width: 100%; height: auto; }
          }
        `}</style>
        <DialogHeader className="no-print">
          <DialogTitle>Relatório de Análise de Projeto</DialogTitle>
          <DialogDescription>Visão completa do desempenho do projeto.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-1 report-scroll-area">
          <div className="printable-report">
            {isLoading && (<div className="flex flex-col items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-lg">Gerando relatório...</p></div>)}
            {reportData && aiAnalysis && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center mb-8">{aiAnalysis.reportTitle}</h2>
                <ReportSection title="Sumário Executivo" content={aiAnalysis.executiveSummary} />
                <ReportSection title="Análise de KPIs" content={aiAnalysis.kpiAnalysis} />
                <ReportSection title="Análise do Caminho Crítico" content={aiAnalysis.criticalPathAnalysis} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 report-card">
                  <Card className="chart-card">
                    <CardHeader><CardTitle>Gráfico de Burndown</CardTitle></CardHeader>
                    <CardContent>
                      <div ref={burndownRef} className="screen-only-chart"><BurndownChart data={reportData.analysis.burndown_data || []} /></div>
                      {/* CORREÇÃO DEFINITIVA: Renderização condicional para evitar src="" */}
                      {chartImages.burndown && <img src={chartImages.burndown} className="print-only-chart" alt="Gráfico de Burndown"/>}
                    </CardContent>
                  </Card>
                  <Card className="chart-card">
                    <CardHeader><CardTitle>Curva S</CardTitle></CardHeader>
                    <CardContent>
                      <div ref={sCurveRef} className="screen-only-chart"><SCurveChart data={reportData.analysis.s_curve_data || []} /></div>
                      {/* CORREÇÃO DEFINITIVA: Renderização condicional para evitar src="" */}
                      {chartImages.sCurve && <img src={chartImages.sCurve} className="print-only-chart" alt="Gráfico de Curva S"/>}
                    </CardContent>
                  </Card>
                </div>
                <ReportSection title="Insight dos Gráficos" content={aiAnalysis.chartInsight} />
                <ReportSection title="Análise de Justificativas" content={aiAnalysis.justificationAnalysis} />
                {reportData.change_history.length > 0 && (
                    <Card className="report-card">
                        <CardHeader><CardTitle>Detalhes das Mudanças de Datas</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Tarefa</TableHead><TableHead>Campo</TableHead><TableHead>De</TableHead><TableHead>Para</TableHead><TableHead>Justificativa</TableHead></TableRow></TableHeader>
                                <TableBody>{reportData.change_history.map((item, index) => (<TableRow key={index}><TableCell>{item.task_name}</TableCell><TableCell>{item.changed_field}</TableCell><TableCell>{item.old_value}</TableCell><TableCell>{item.new_value}</TableCell><TableCell>{item.justification}</TableCell></TableRow>))}</TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
                <ReportSection title="Recomendações" content={aiAnalysis.recommendations} />
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="report-footer no-print">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <Button onClick={handlePrint} disabled={isLoading || !reportData || isPreparingPrint}>
                {isPreparingPrint ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />} 
                Preparar Impressão
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
