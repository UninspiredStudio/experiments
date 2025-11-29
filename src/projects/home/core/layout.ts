export interface HomeLayoutElements {
  canvas: HTMLCanvasElement | null
  canvasContainer: HTMLElement | null
  headerContent: HTMLElement | null
  infoBlocks: HTMLElement | null
  projectCards: NodeListOf<HTMLElement>
  projectImages: NodeListOf<HTMLImageElement>
  projectHeaders: NodeListOf<HTMLElement>
  animatedElements: NodeListOf<HTMLElement>
}

export function getHomeLayoutElements(doc: Document = document): HomeLayoutElements {
  const canvasElement = doc.getElementById('warpCanvas')

  return {
    canvas: canvasElement instanceof HTMLCanvasElement ? canvasElement : null,
    canvasContainer: doc.getElementById('canvasContainer'),
    headerContent: doc.querySelector<HTMLElement>('.header-content'),
    infoBlocks: doc.querySelector<HTMLElement>('.info-blocks'),
    projectCards: doc.querySelectorAll<HTMLElement>('.project-card'),
    projectImages: doc.querySelectorAll<HTMLImageElement>('.project-image'),
    projectHeaders: doc.querySelectorAll<HTMLElement>('.project-header'),
    animatedElements: doc.querySelectorAll<HTMLElement>(
      '.header-content, .info-blocks, .project-image, .project-header',
    ),
  }
}
