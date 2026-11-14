import { ApiError, type Api } from './types';

const BASE = '/api';

async function parseError(res: Response): Promise<ApiError> {
  try {
    const data = await res.json();
    const e = data?.error;
    if (e?.message) return new ApiError(e.message, e.code ?? 'UNKNOWN', res.status);
    if (typeof data?.detail === 'string') return new ApiError(data.detail, 'UNKNOWN', res.status);
  } catch {
    /* 본문이 JSON이 아님 */
  }
  return new ApiError(`요청에 실패했습니다. (HTTP ${res.status})`, 'HTTP_ERROR', res.status);
}

async function raw(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.', 'NETWORK_ERROR', 0);
  }
  if (!res.ok) throw await parseError(res);
  return res;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await raw(path, init);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function filenameFrom(res: Response, fallback: string): string {
  const cd = res.headers.get('Content-Disposition') ?? '';
  const star = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* fallthrough */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(cd);
  return plain ? plain[1] : fallback;
}

export const realApi: Api = {
  createCase: (body) => json('/cases', jsonInit('POST', body)),
  listCases: () => json('/cases'),
  getCase: (id) => json(`/cases/${encodeURIComponent(id)}`),
  deleteCase: (id) => json(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  inputUrl: (id, url) => json(`/cases/${encodeURIComponent(id)}/inputs/url`, jsonInit('POST', { url })),
  inputText: (id, body) => json(`/cases/${encodeURIComponent(id)}/inputs/text`, jsonInit('POST', body)),
  inputImage: (id, file, sourceUrl, context) => {
    const fd = new FormData();
    fd.append('file', file);
    if (sourceUrl) fd.append('source_url', sourceUrl);
    if (context) fd.append('context', context);
    return json(`/cases/${encodeURIComponent(id)}/inputs/image`, { method: 'POST', body: fd });
  },
  analyze: (id, commentIds) =>
    json(`/cases/${encodeURIComponent(id)}/analyze`, jsonInit('POST', { comment_ids: commentIds })),
  patchComment: (commentId, patch) => json(`/comments/${encodeURIComponent(commentId)}`, jsonInit('PATCH', patch)),
  agentReview: (id) => json(`/cases/${encodeURIComponent(id)}/agent/review`, { method: 'POST' }),
  agentAnswers: (id, answers) =>
    json(`/cases/${encodeURIComponent(id)}/agent/answers`, jsonInit('POST', { answers })),
  downloadDocument: async (id, kind) => {
    const res = await raw(`/cases/${encodeURIComponent(id)}/documents/${kind}.pdf`);
    return { blob: await res.blob(), filename: filenameFrom(res, `${kind}.pdf`) };
  },
};
