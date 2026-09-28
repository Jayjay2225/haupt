/**
 * „Später weitermachen“-Link per E-Mail (Prompt 12, 3.4; Prompt 14: im Funnel
 * ab Schritt 3 – eine Ergebnis-Seite gibt es in der Privatkunden-Variante
 * nicht mehr). Der Link trägt den Zwischenstand selbst (lib/fortsetzen.ts) –
 * gespeichert wird serverseitig nichts.
 */
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { spaeterWeitermachen } from '@/lib/emails';
import { auslieferungsVerzeichnis } from '@/lib/erfuellung';
import { erzeugeFortsetzenToken, fortsetzenLink } from '@/lib/fortsetzen';
import { kundenname, uebernehmeBekannteFelder } from '@/lib/draft';
import { begrenzt, clientSchluessel } from '@/lib/ratenlimit';
import { sendeMail } from '@/lib/versand';
import { basisUrl } from '@/lib/zahlung';

export const runtime = 'nodejs';

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request): Promise<NextResponse> {
  // Enger als die Vorschau: E-Mail-Versand ist missbrauchbar (Spam-Schutz).
  if (begrenzt(`weitermachen:${clientSchluessel(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const eingabe = (roh ?? {}) as Record<string, unknown>;
  const draft = uebernehmeBekannteFelder(
    typeof eingabe['draft'] === 'object' && eingabe['draft'] !== null
      ? (eingabe['draft'] as Record<string, unknown>)
      : {},
  );
  const email = draft.email.trim();
  if (!EMAIL_MUSTER.test(email) || !draft.einwilligungDatenschutz) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }
  try {
    const token = erzeugeFortsetzenToken(draft);
    const vorlage = spaeterWeitermachen(kundenname(draft), fortsetzenLink(basisUrl(), token));
    await sendeMail(
      { an: email, betreff: vorlage.betreff, text: vorlage.text },
      resolve(auslieferungsVerzeichnis(), 'weitermachen-links'),
    );
    return NextResponse.json({ ok: true });
  } catch (fehler) {
    console.error('weitermachen-link versand fehlgeschlagen:', (fehler as Error).message);
    // Bewusst kein Fehler an den Client: der Assistent läuft unabhängig davon weiter.
    return NextResponse.json({ ok: false });
  }
}
