import { supabase } from './supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function parseError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await error.context?.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return parsed.error || parsed.details || text;
        } catch {
          return text;
        }
      }
    } catch {}
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}

export async function callLbData<T = unknown>(
  action: string,
  userId: string,
  params: Record<string, unknown> = {}
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('lb-data', {
    body: { action, userId, ...params },
  });
  if (error) return { data: null, error: await parseError(error) };
  if (data?.error) return { data: null, error: data.error };
  return { data: (data?.data ?? data) as T, error: null };
}

export async function invokeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) return { data: null, error: await parseError(error) };
  if (data?.error) return { data: null, error: data.error };
  return { data: data as T, error: null };
}
