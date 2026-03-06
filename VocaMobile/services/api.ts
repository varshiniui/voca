const BACKEND_URL = 'https://voca-production-42bf.up.railway.app';

export async function summarizeAudio(audioUri: string, language: string | null): Promise<any> {
  const formData = new FormData();
  formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'note.m4a' } as any);
  if (language) formData.append('language', language);
  const res = await fetch(`${BACKEND_URL}/api/summarize`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || 'Failed');
  return data;
}

export async function getNotes(): Promise<any[]> {
  const res = await fetch(`${BACKEND_URL}/api/notes`);
  const data = await res.json();
  return data.notes || [];
}

export async function deleteNote(id: number): Promise<void> {
  await fetch(`${BACKEND_URL}/api/notes/${id}`, { method: 'DELETE' });
}