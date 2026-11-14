import { useEffect, useState } from 'react';
import { api } from '../api';
import { errMessage } from '../lib/format';
import { isHttpUrl } from '../lib/share';
import type { InputResponse } from '../types';
import { Button, Card, ErrorBox, InfoBox, inputCls } from './common';

type Mode = 'url' | 'text' | 'image';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /\.(png|jpe?g|webp)$/i;

interface Props {
  caseId: string;
  initialUrl?: string;
  onDone: (res: InputResponse) => void;
}

export default function InputPanel({ caseId, initialUrl = '', onDone }: Props) {
  const [mode, setMode] = useState<Mode>(initialUrl ? 'url' : 'text');
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [context, setContext] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      setMode('url');
    }
  }, [initialUrl]);

  async function run(fn: () => Promise<InputResponse>, reset: () => void) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fn();
      if (res.source.needs_manual_input) {
        setNotice(res.source.message ?? '자동 수집이 되지 않았습니다. 텍스트나 스크린샷으로 직접 입력해 주세요.');
      } else {
        setNotice(`댓글 ${res.comments.length}개를 가져왔습니다.`);
      }
      reset();
      onDone(res);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function submitUrl() {
    const v = url.trim();
    if (!isHttpUrl(v)) return setError('http:// 또는 https:// 로 시작하는 올바른 주소를 입력해 주세요.');
    void run(() => api.inputUrl(caseId, v), () => setUrl(''));
  }

  function submitText() {
    if (!text.trim()) return setError('댓글 내용을 붙여넣어 주세요.');
    const su = sourceUrl.trim();
    if (su && !isHttpUrl(su)) return setError('원본 게시글 주소 형식이 올바르지 않습니다.');
    void run(
      () => api.inputText(caseId, { text, source_url: su || null, context: context.trim() || null }),
      () => {
        setText('');
        setContext('');
      },
    );
  }

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (!ALLOWED.test(f.name)) return setError('png, jpg, jpeg, webp 파일만 올릴 수 있습니다.');
    if (f.size > MAX_BYTES) return setError('파일 크기는 10MB 이하여야 합니다.');
    setFile(f);
  }

  function submitImage() {
    if (!file) return setError('이미지를 선택해 주세요.');
    const su = sourceUrl.trim();
    if (su && !isHttpUrl(su)) return setError('원본 게시글 주소 형식이 올바르지 않습니다.');
    void run(
      () => api.inputImage(caseId, file, su || null, context.trim() || null),
      () => setFile(null),
    );
  }

  const tabs: { key: Mode; label: string }[] = [
    { key: 'url', label: 'URL' },
    { key: 'text', label: '텍스트' },
    { key: 'image', label: '스크린샷' },
  ];

  return (
    <Card className="space-y-3">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={mode === t.key}
            onClick={() => {
              setMode(t.key);
              setError(null);
            }}
            className={`min-h-10 rounded-md text-sm font-semibold ${mode === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'url' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            게시물 주소
            <input
              className={`${inputCls} mt-1`}
              inputMode="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <InfoBox>
            YouTube 주소는 공개 댓글을 최대 200개까지 가져옵니다. 그 밖의 SNS는 주소만 출처로 저장하고 댓글은 직접 입력해야 합니다.
          </InfoBox>
          <Button className="w-full" busy={busy} onClick={submitUrl}>
            댓글 가져오기
          </Button>
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            댓글 내용 (한 줄에 하나)
            <textarea className={`${inputCls} mt-1 min-h-32`} value={text} onChange={(e) => setText(e.target.value)} placeholder="댓글을 붙여넣어 주세요" />
          </label>
          <SourceFields sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} context={context} setContext={setContext} />
          <Button className="w-full" busy={busy} onClick={submitText}>
            댓글 추가
          </Button>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            댓글 스크린샷 (png/jpg/webp, 10MB 이하)
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2.5 file:font-semibold file:text-indigo-700"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && <p className="text-xs text-slate-500">선택됨: {file.name} ({(file.size / 1024).toFixed(0)}KB)</p>}
          <SourceFields sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} context={context} setContext={setContext} />
          <InfoBox tone="warn">
            AI가 읽은 작성자·시각은 틀릴 수 있습니다. 읽지 못한 값은 비워 두며, 저장 전에 원본과 비교해 확인해 주세요. 원본 이미지는 서버로 전송됩니다.
          </InfoBox>
          <Button className="w-full" busy={busy} onClick={submitImage}>
            댓글 추출
          </Button>
        </div>
      )}

      <ErrorBox message={error} onClose={() => setError(null)} />
      {notice && !error && <InfoBox>{notice}</InfoBox>}
    </Card>
  );
}

function SourceFields(p: { sourceUrl: string; setSourceUrl: (v: string) => void; context: string; setContext: (v: string) => void }) {
  return (
    <>
      <label className="block text-sm font-medium">
        원본 게시글 주소 (선택)
        <input className={`${inputCls} mt-1`} inputMode="url" value={p.sourceUrl} onChange={(e) => p.setSourceUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="block text-sm font-medium">
        원본 게시글 맥락 (선택)
        <textarea className={`${inputCls} mt-1 min-h-20`} value={p.context} onChange={(e) => p.setContext(e.target.value)} placeholder="어떤 게시물에 달린 댓글인지 적어 주세요" />
      </label>
    </>
  );
}
