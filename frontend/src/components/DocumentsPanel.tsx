import { useState } from 'react';
import { api } from '../api';
import { errMessage, triggerDownload } from '../lib/format';
import type { DocumentKind } from '../types';
import { Button, Card, Disclaimer, ErrorBox } from './common';

const DOCS: { kind: DocumentKind; title: string; desc: string }[] = [
  { kind: 'statement', title: '사건 경위서', desc: '사건 정보와 저장된 증거를 정리합니다. 확인된 사실과 AI 분석 추정이 구분됩니다.' },
  { kind: 'evidence-list', title: '증거 목록', desc: '증거 번호, 댓글, 작성자, 시각, URL, 수집 시각, SHA-256을 표로 정리합니다.' },
];

export default function DocumentsPanel({ caseId, savedCount }: { caseId: string; savedCount: number }) {
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(kind: DocumentKind) {
    setBusy(kind);
    setError(null);
    try {
      const { blob, filename } = await api.downloadDocument(caseId, kind);
      triggerDownload(blob, filename);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {savedCount === 0 && <ErrorBox message="저장된 증거가 없습니다. 댓글 탭에서 증거함에 저장한 뒤 문서를 만들 수 있습니다." />}
      <ErrorBox message={error} onClose={() => setError(null)} />
      {DOCS.map((d) => (
        <Card key={d.kind} className="space-y-2">
          <h3 className="font-semibold">{d.title}</h3>
          <p className="text-sm text-slate-600">{d.desc}</p>
          <Button className="w-full" busy={busy === d.kind} disabled={busy !== null} onClick={() => void download(d.kind)}>
            PDF 다운로드
          </Button>
        </Card>
      ))}
      <Disclaimer />
    </div>
  );
}
