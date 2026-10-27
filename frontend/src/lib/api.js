export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch('/api' + path, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(25000),
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError(
      error.name === 'TimeoutError'
        ? 'The request took too long. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.',
      0,
    );
  }
  const data = await response
    .json()
    .catch(() => ({ message: 'The server returned an unexpected response.' }));
  if (!response.ok) throw new ApiError(data.message || 'Request failed.', response.status);
  return data;
}
