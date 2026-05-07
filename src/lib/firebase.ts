export async function fbSet(path: string, data: unknown) {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, data, method: 'PUT' }),
  }).catch(console.error);
}

export async function fbDelete(path: string) {
  await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method: 'DELETE' }),
  }).catch(console.error);
}

export async function fbGet(path = 'lms') {
  const res = await fetch(`/api/db?path=${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
