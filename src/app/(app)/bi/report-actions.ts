'use server';

import { generateProjectReport, type GenerateProjectReportInput } from '@/ai/flows/project-report-generator';

export async function generateProjectReportAction(input: GenerateProjectReportInput) {
  try {
    return await generateProjectReport(input);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate project report: ${message}`);
  }
}

