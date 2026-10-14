import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { MeetingAnalysis } from './api'

export type SummaryMetadata = { title: string; date: string; duration: string }

const brand = { ink: '#123544', mint: '#5FE0C1', muted: '#5C747B' }
const temperatureLabels = { POSITIVA: 'Positiva', NEUTRA: 'Neutra', TENSA: 'Tensa' }

export function summaryFilename(title: string): string {
  const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '')
  return `resumo-executivo-${slug || 'reuniao'}.pdf`
}

function section(title: string, items: string[], empty = 'Não identificado na transcrição.'): Content[] {
  return [
    { text: title, style: 'section', headlineLevel: 1 },
    items.length
      ? { ul: items.map(text => ({ text, margin: [0, 0, 0, 5] })), margin: [0, 0, 0, 2] }
      : { text: empty, color: brand.muted, italics: true },
  ]
}

export function createSummaryDocument(meeting: SummaryMetadata, analysis: MeetingAnalysis, logo: string): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [48, 100, 48, 58],
    info: { title: `Resumo executivo - ${meeting.title}`, author: 'Orientador', subject: 'Análise executiva da reunião' },
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.3, color: brand.ink },
    images: { orientador: logo },
    header: {
      margin: [48, 26, 48, 0],
      stack: [
        { image: 'orientador', width: 154 },
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 499, y2: 8, lineWidth: 2, lineColor: brand.mint }] },
      ],
    },
    footer: (page, pages) => ({
      margin: [48, 16, 48, 0],
      columns: [
        { text: 'Orientador · Análise gerada por IA', color: brand.muted, fontSize: 8 },
        { text: `Página ${page} de ${pages}`, alignment: 'right', color: brand.muted, fontSize: 8 },
      ],
    }),
    styles: {
      section: { fontSize: 12, bold: true, color: brand.ink, margin: [0, 17, 0, 7] },
      metaLabel: { fontSize: 8, color: brand.muted, margin: [0, 0, 0, 3] },
    },
    content: [
      { text: 'RESUMO EXECUTIVO', fontSize: 9, bold: true, characterSpacing: 1.5, color: '#16816D', margin: [0, 0, 0, 8] },
      { text: meeting.title, fontSize: 24, bold: true, lineHeight: 1.1, margin: [0, 0, 0, 18] },
      {
        columns: [
          { stack: [{ text: 'DATA DA REUNIÃO', style: 'metaLabel' }, { text: meeting.date }] },
          { width: 140, stack: [{ text: 'DURAÇÃO (MIN:SEG)', style: 'metaLabel' }, { text: meeting.duration }] },
        ],
        margin: [0, 0, 0, 5],
      },
      { text: 'Visão geral', style: 'section', headlineLevel: 1 },
      { text: analysis.overview },
      ...section('Decisões e acordos', analysis.decisions),
      ...section('Pendências e próximos passos', analysis.nextSteps),
      ...section('Riscos e objeções', analysis.risks),
      ...section('Pontos-chave', analysis.keyPoints),
      ...section('Nomes Identificados', analysis.participants, 'Nenhum nome identificado na transcrição'),
      { text: `Temperatura: ${temperatureLabels[analysis.temperature]}`, style: 'section', headlineLevel: 1 },
      { text: analysis.temperatureReason },
    ],
    pageBreakBefore: (node, container) => node.headlineLevel === 1 && container.getFollowingNodesOnPage().length === 0,
  }
}
