
"use client";

import { Suspense } from "react";
import PageHeader from "@/components/shared/page-header";
import BacklogView from "@/components/backlog/backlog-view";

const MemberMyTasksPageContent = () => {
    return (
        <div className="flex flex-col gap-4 h-full">
            <PageHeader 
                title="Minhas Tarefas" 
                description={`Aqui estão todas as tarefas atribuídas a você em todos os projetos.`}
            />
            {/* O BacklogView agora tem a lógica para filtrar as tarefas do usuário */}
            <BacklogView 
                selectedProject="consolidated"
                viewType="my-tasks"
                userRole="member"
            />
        </div>
    )
}


export default function MemberMyTasksPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Carregando tarefas...</div>}>
            <MemberMyTasksPageContent />
        </Suspense>
    )
}
