'use client';

import { supabase } from './supabase';

export type ImportType = 'csv' | 'xml' | 'mpp';

export interface ImportResult {
  success: boolean;
  errors: string[];
  projectId?: string;
  taskIds?: string[];
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

if (!BUCKET_NAME) {
  throw new Error(
    'Supabase storage bucket name is not defined. Set NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET in your environment.',
  );
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export async function importFile(
  file: File,
  type: ImportType,
  options: {
    projectId?: string;
    mappings?: Record<string, string>;
    userId?: string;
  } = {}
): Promise<ImportResult> {
  try {
    switch (type) {
      case 'csv': {
        const { projectId, mappings } = options;
        if (!projectId || !mappings) {
          return { success: false, errors: ['projectId e mappings são obrigatórios para importação CSV.'] };
        }
        const fileAsBase64 = await fileToBase64(file);
        const uploadRes = await supabase.functions.invoke('secure-file-upload', {
          body: { file: fileAsBase64, fileName: file.name, projectId },
        });
        if (uploadRes.error) {
          return { success: false, errors: [uploadRes.error.message] };
        }
        const filePath = uploadRes.data.filePath;
        const { data, error } = await supabase.functions.invoke('import-tasks', {
          body: { filePath, projectId, mappings },
        });
        if (error) {
          return { success: false, errors: [error.message] };
        }
        return { success: true, errors: data?.errors ?? [] };
      }
      case 'xml':
      case 'mpp': {
        const { userId } = options;
        if (!userId) {
          return { success: false, errors: ['userId é obrigatório para importação de projetos.'] };
        }
        const filePath = `user-uploads/${userId}/project-imports/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        if (uploadError) {
          return { success: false, errors: [uploadError.message] };
        }
        const { data, error } = await supabase.functions.invoke('import-project-file', {
          body: { filePath },
        });
        if (error) {
          return { success: false, errors: [error.message] };
        }
        return { success: true, errors: data?.errors ?? [], projectId: data?.newProjectId };
      }
      default:
        return { success: false, errors: ['Tipo de importação não suportado.'] };
    }
  } catch (err: any) {
    return { success: false, errors: [err.message] };
  }
}

