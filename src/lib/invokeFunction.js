import { supabase } from './supabase';

// Calls a Supabase edge function and returns its data.
// When the function responds with an error status, supabase-js only reports a
// generic "non-2xx status code" message — this reads the function's own
// { error: "..." } message instead, so people see e.g. "Only 2 left of …".
export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const payload = await error.context?.json();
      if (payload?.error) message = payload.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
