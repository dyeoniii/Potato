import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { errMessage, triggerDownload } from '../lib/format';
import type { DocumentKind } from '../types';
import { Button, Card, Disclaimer, ErrorBox, InfoBox } from './common';

const DOCS: { kind: DocumentKind; title: string; desc: string }[] = [
  { kind: 'statement', title: '사건 경위서', desc: '사건 정보와 저장된 증거를 정리합니다. 확인된 사실과 AI 분석 추정이 구분됩니다.' },
  { kind: 'evidence-list', title: '증거자료 목록', desc: '증거 번호, 댓글, 작성자, 시각, URL, 수집 시각, SHA-256을 표로 정리합니다.' },
];

export default function DocumentsPanel({ caseId, savedCount }: { caseId: string; savedCount: number }) {
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function download(kind: DocumentKind) {
    setBusy(kind);
    setError(null);
    setDone(null);
    try {
      const { blob, filename } = await api.downloadDocument(caseId, kind);
      triggerDownload(blob, filename);
      setDone(`${filename} 파일을 내려받았습니다.`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {savedCount === 0 && <InfoBox tone="warn">저장된 증거가 없습니다. 판독 탭에서 댓글을 증거함에 저장한 뒤 문서를 만들 수 있습니다.</InfoBox>}
      <ErrorBox message={error} onClose={() => setError(null)} />
      {done && <InfoBox>{done}</InfoBox>}
      <div className="grid gap-3 sm:grid-cols-2">
        {DOCS.map((d) => (
          <Card key={d.kind} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-semibold">{d.title}</h3>
            </div>
            <p className="flex-1 text-sm text-ink-600">{d.desc}</p>
            <Button className="w-full" busy={busy === d.kind} busyLabel="PDF 만드는 중…" disabled={busy !== null || savedCount === 0} onClick={() => void download(d.kind)}>
              <Download className="h-4 w-4" aria-hidden />
              PDF 다운로드
            </Button>
          </Card>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
