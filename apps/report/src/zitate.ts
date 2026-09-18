/**
 * Wörtliche Zitate für Seite 2 des Berichts – übernommen aus docs/LEGAL.md.
 * WICHTIG: Wiedergabe nach frei zugänglichen Volltext-Spiegeln; der
 * Wort-für-Wort-Abgleich mit den amtlichen Datenbanken steht aus
 * (docs/LEGAL-OPEN-QUESTIONS.md Nr. 1) und wird im Bericht offengelegt.
 */

export interface Zitat {
  gericht: string;
  az: string;
  datum: string;
  einordnung: string;
  zitat: string;
}

export const ZITAT_QUELLENHINWEIS =
  'Wiedergabe der Entscheidungstexte nach frei zugänglichen Volltext-Spiegeln (lexetius.com, urteile-gesetze.de, RIS); der Wort-für-Wort-Abgleich mit den amtlichen Entscheidungsdatenbanken ist in Arbeit.';

export const ZITATE_REGIME_ALT: Zitat[] = [
  {
    gericht: 'EuGH',
    az: 'C-209/12 („Endress")',
    datum: '19.12.2013',
    einordnung: 'Die Jahresfrist des § 5a Abs. 2 Satz 4 VVG a.F. ist mit dem Unionsrecht unvereinbar:',
    zitat:
      '„… ist dahin auszulegen, dass er einer nationalen Regelung wie der im Ausgangsverfahren fraglichen entgegensteht, nach der ein Rücktrittsrecht spätestens ein Jahr nach Zahlung der ersten Versicherungsprämie erlischt, wenn der Versicherungsnehmer nicht über das Recht zum Rücktritt belehrt worden ist." (Tenor, gekürzt um die Richtlinienbezeichnungen)',
  },
  {
    gericht: 'BGH',
    az: 'IV ZR 76/11 (BGHZ 201, 101)',
    datum: '07.05.2014',
    einordnung:
      'Bei fehlender oder fehlerhafter Belehrung besteht das Widerspruchsrecht fort; in der bereicherungsrechtlichen Rückabwicklung ist der genossene Versicherungsschutz anzurechnen:',
    zitat:
      '„… den Versicherungsschutz anrechnen lassen, den er jedenfalls bis zur Kündigung des Vertrages genossen hat"; dessen Wert „kann unter Berücksichtigung der Prämienkalkulation bemessen werden; bei Lebensversicherungen kann etwa dem Risikoanteil Bedeutung zukommen" (Rn. 51).',
  },
  {
    gericht: 'BGH',
    az: 'IV ZR 513/14',
    datum: '11.11.2015',
    einordnung: 'Maßstab des Nutzungsersatzes ist die Ertragslage des jeweiligen Versicherers:',
    zitat:
      '„Der Versicherungsnehmer kann nur vom Versicherer tatsächlich gezogene Nutzungen herausverlangen und trägt hierfür die Darlegungs- und Beweislast. Er kann seinen Tatsachenvortrag nicht ohne Bezug zur Ertragslage des jeweiligen Versicherers auf eine tatsächliche Vermutung einer Gewinnerzielung in bestimmter Höhe stützen." (Leitsatz 2)',
  },
];

export const ZITAT_ANTRAGSMODELL: Zitat = {
  gericht: 'BGH',
  az: 'IV ZR 260/11',
  datum: '17.12.2014',
  einordnung: 'Für das Antragsmodell (Rücktritt nach § 8 VVG a.F.) gilt Entsprechendes:',
  zitat:
    '„Die in § 8 Abs. 4 Satz 4 und Abs. 5 Satz 4 VVG a.F. getroffene Regelung, nach welcher auch bei nicht ordnungsgemäßer Belehrung des Versicherungsnehmers über sein jeweiliges Lösungsrecht dieses einen Monat nach Zahlung der ersten Prämie erlischt, ist richtlinienkonform einschränkend dahin auszulegen, dass sie im Bereich der Lebens- und Rentenversicherung und der Zusatzversicherung zur Lebensversicherung nicht anwendbar ist …" (amtlicher Leitsatz, gekürzt)',
};
