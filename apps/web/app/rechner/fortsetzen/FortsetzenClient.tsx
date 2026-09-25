'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { speichereDraft, type CaseDraft } from '@/lib/draft';

export function FortsetzenClient({ draft }: { draft: CaseDraft }) {
  const router = useRouter();
  const [uebernommen, setUebernommen] = useState(false);

  useEffect(() => {
    speichereDraft(draft);
    setUebernommen(true);
    router.replace(draft.eingereichtAm !== '' ? '/rechner/ergebnis' : '/rechner');
  }, [draft, router]);

  return (
    <>
      <h1>Ihre Angaben sind wieder da.</h1>
      <p>{uebernommen ? 'Einen Moment – wir leiten Sie weiter …' : 'Ihre Angaben werden übernommen …'}</p>
    </>
  );
}
