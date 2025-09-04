import { API_BASE } from './config'

export async function apiPost(path: string, body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await res.text())
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include'
  })
  if (!res.ok) throw new Error(await res.text())
  try {
    return await res.json()
  } catch {
    return {}
  }
}
