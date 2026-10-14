import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import logoUrl from '../../assets/brand/orientador-logo.svg'
import type { MeetingAnalysis } from './api'
import { createSummaryDocument, summaryFilename, type SummaryMetadata } from './executiveSummaryDocument'

pdfMake.addVirtualFileSystem(pdfFonts)

async function loadLogo(): Promise<string> {
  const image = new Image()
  image.src = logoUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = 880
  canvas.height = 260
  const context = canvas.getContext('2d')
  if (!context) throw new Error('PDF_LOGO_CANVAS_UNAVAILABLE')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export async function exportExecutiveSummary(meeting: SummaryMetadata, analysis: MeetingAnalysis): Promise<void> {
  const logo = await loadLogo()
  const document = createSummaryDocument(meeting, analysis, logo)
  await pdfMake.createPdf(document).download(summaryFilename(meeting.title))
}
