import { supabase } from './supabase';

function sanitizeE164(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export async function sendWhatsappNotification(to: string, message: string) {
  const sanitizedTo = sanitizeE164(to);
  const result = await supabase.functions.invoke('send-whatsapp-notification', {
    body: { to: sanitizedTo, body: message },
  });
  if (result.error) {
    console.error(result.error.message);
    throw result.error;
  }
}

