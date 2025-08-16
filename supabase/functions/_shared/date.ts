import { parseISO, format } from "npm:date-fns@3.6.0";

export const parseAndFormatDate = (dateStr: string, fieldName: string, lineNumber: number): string => {
  if (!dateStr) throw new Error(`O campo de data '${fieldName}' está vazio.`);
  try {
    const d = parseISO(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) {
      const parts = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
      if (parts) {
        const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
        const isoStr = `${year}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        const d2 = parseISO(`${isoStr}T00:00:00`);
        if (!isNaN(d2.getTime())) {
          const result = format(d2, "yyyy-MM-dd");
          console.log(`parseAndFormatDate: '${dateStr}' -> '${result}'`);
          return result;
        }
      }
      throw new Error(`Formato de data inválido para '${dateStr}' em '${fieldName}'. Use YYYY-MM-DD.`);
    }
    const result = format(d, "yyyy-MM-dd");
    console.log(`parseAndFormatDate: '${dateStr}' -> '${result}'`);
    return result;
  } catch (e) {
    throw new Error(`Não foi possível processar a data '${dateStr}' em '${fieldName}'.`);
  }
};

export const parseDate = (dateStr: any): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  try {
    const d = parseISO(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const result = format(d, "yyyy-MM-dd");
    console.log(`parseDate: '${dateStr}' -> '${result}'`);
    return result;
  } catch {
    return null;
  }
};
