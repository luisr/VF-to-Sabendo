import { parseISO, format } from 'date-fns';

/**
 * Converte uma string de data (ex: '2024-07-30') para um objeto Date,
 * garantindo que seja interpretada no fuso horário local e não em UTC.
 * Isso evita o bug comum de a data "pular" para o dia anterior.
 * @param dateString A string de data no formato 'YYYY-MM-DD'.
 * @returns Um objeto Date ou undefined se a entrada for nula/inválida.
 */
export const parseUTCDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) {
    return undefined;
  }
  // Adiciona 'T00:00:00' para forçar a interpretação no fuso horário local
  return parseISO(`${dateString}T00:00:00`);
};

/**
 * Formata um objeto Date para uma string no formato 'YYYY-MM-DD' para ser
 * salva de forma segura no banco de dados.
 * @param date O objeto Date a ser formatado.
 * @returns A string de data formatada ou null se a entrada for nula/inválida.
 */
export const formatToISODate = (date: Date | null | undefined): string | null => {
    if (!date || !(date instanceof Date)) {
        return null;
    }
    return format(date, 'yyyy-MM-dd');
};
