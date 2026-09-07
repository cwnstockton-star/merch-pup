// Guards against Supabase calls that hang instead of resolving or rejecting,
// which would otherwise leave a button stuck in its loading state forever
// with no way to recover.
export function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('This is taking longer than expected. Check your connection and try again.')), ms)
    ),
  ]);
}
