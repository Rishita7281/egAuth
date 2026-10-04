export async function callApi({ base, path, method = 'GET', body, token }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}
