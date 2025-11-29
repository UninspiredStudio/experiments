import type { StarfieldController } from '../rendering/starfield'
import { getHomeLayoutElements } from '../core/layout'

type AnimationClass = 'fade-out' | 'slide-up' | 'fade-in'

const FADE_DURATION = 300
const _SHRINK_DURATION = 500
const SLIDE_UP_DURATION = 800
const CANVAS_FADE_IN_DURATION = 700
const TOTAL_NAVIGATE_DELAY = FADE_DURATION + FADE_DURATION + SLIDE_UP_DURATION + FADE_DURATION
const _TOTAL_WARP_ANIMATION_DURATION = FADE_DURATION * 3 + SLIDE_UP_DURATION
const FULL_ANIMATION_DURATION = TOTAL_NAVIGATE_DELAY + CANVAS_FADE_IN_DURATION

export function initHomePageTransitions(starfield: StarfieldController, doc: Document = document): void {
  const links = doc.querySelectorAll<HTMLAnchorElement>('a')
  const {
    headerContent,
    infoBlocks,
    canvasContainer,
    projectImages,
    animatedElements,
  } = getHomeLayoutElements(doc)

  let isAnimating = false

  const animationClassesToRemove: string[] = [
    'fade-out',
    'slide-up',
    'fade-out-transition',
    'slide-up-transition',
  ]

  animatedElements.forEach((element) => {
    if (element !== null) {
      animationClassesToRemove.forEach((cls) => element.classList.remove(cls))

      if (element.classList.contains('project-image')) {
        element.style.maxHeight = ''
        element.style.paddingTop = ''
        element.style.paddingBottom = ''
      }

      if (canvasContainer !== null && element === canvasContainer) {
        element.classList.remove('fade-in', 'fade-in-transition')
        element.style.opacity = '0'
      } else {
        element.style.opacity = ''
      }
    }
  })

  if (canvasContainer !== null) {
    canvasContainer.classList.remove('fade-in', 'fade-in-transition')
    canvasContainer.style.opacity = '0'
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href')
      if (href === null || href === '' || href.startsWith('#') || link.classList.contains('no-exit-animation')) {
        return
      }

      if (isAnimating) {
        event.preventDefault()
        return
      }

      isAnimating = true
      event.preventDefault()

      const targetUrl = href

      const projectCard = link.closest<HTMLElement>('.project-card')
      const projectImage = projectCard?.querySelector<HTMLImageElement>('.project-image') ?? null
      const projectHeader = projectCard?.querySelector<HTMLElement>('.project-header') ?? null

      starfield.triggerVisibilityRamp()
      void animatePageExit(targetUrl, projectImage, projectHeader, {
        headerContent,
        infoBlocks,
        canvasContainer,
        projectImages,
        starfield,
      })
    })
  })

  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (!event.persisted) {
      return
    }

    isAnimating = false

    const header = doc.querySelector<HTMLElement>('.header-content')
    const info = doc.querySelector<HTMLElement>('.info-blocks')
    const allProjectImages = doc.querySelectorAll<HTMLImageElement>('.project-image')
    const allProjectHeaders = doc.querySelectorAll<HTMLElement>('.project-header')
    const canvas = doc.getElementById('canvasContainer')

    const elementsToReset: (HTMLElement | null)[] = [
      header,
      info,
      canvas,
      ...Array.from(allProjectImages),
      ...Array.from(allProjectHeaders),
    ]

    const classesToRemove: string[] = [
      'fade-out',
      'slide-up',
      'fade-in',
      'fade-out-transition',
      'slide-up-transition',
      'fade-in-transition',
    ]

    elementsToReset.forEach((element) => {
      if (element !== null) {
        classesToRemove.forEach((cls) => element.classList.remove(cls))
        element.style.opacity = ''
        element.style.animation = ''

        if (element.classList.contains('project-image')) {
          element.style.maxHeight = ''
          element.style.paddingTop = ''
          element.style.paddingBottom = ''
        }

        if (canvas !== null && element === canvas) {
          element.style.opacity = '0'
        }
      }
    })

    if (header !== null) {header.style.opacity = '1'}
    if (info !== null) {info.style.opacity = '1'}
    allProjectImages.forEach((img) => {
      img.style.opacity = '1'
    })
    allProjectHeaders.forEach((hdr) => {
      hdr.style.opacity = '1'
    })
  })
}

interface ExitAnimationContext {
  headerContent: HTMLElement | null
  infoBlocks: HTMLElement | null
  canvasContainer: HTMLElement | null
  projectImages: NodeListOf<HTMLImageElement>
  starfield: StarfieldController
}

async function animatePageExit(
  targetUrl: string,
  projectImage: HTMLImageElement | null,
  projectHeader: HTMLElement | null,
  context: ExitAnimationContext,
): Promise<void> {
  const { headerContent, infoBlocks, canvasContainer, projectImages, starfield } = context

  animateWarpSpeed(starfield, starfield.getWarpSpeed(), 5, FULL_ANIMATION_DURATION)

  const allProjectImages = projectImages

  await applyAnimation(headerContent, 'fade-out', FADE_DURATION)
  await applyAnimation(infoBlocks, 'fade-out', FADE_DURATION)

  const imageSlidePromises: Array<Promise<void>> = []
  allProjectImages.forEach((img) => {
    img.style.maxHeight = `${img.offsetHeight}px`
    // Force reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    img.offsetHeight
    imageSlidePromises.push(applyAnimation(img, 'slide-up', SLIDE_UP_DURATION))
  })
  await Promise.all(imageSlidePromises)

  const allProjectTitles = document.querySelectorAll<HTMLElement>('.project-header')
  const titleFadePromises: Array<Promise<void>> = []
  allProjectTitles.forEach((title) => {
    titleFadePromises.push(applyAnimation(title, 'fade-out', FADE_DURATION))
  })
  await Promise.all(titleFadePromises)

  if (canvasContainer !== null) {
    void applyAnimation(canvasContainer, 'fade-in', CANVAS_FADE_IN_DURATION)
  }

  window.setTimeout(() => {
    window.location.href = targetUrl
  }, TOTAL_NAVIGATE_DELAY)

  void projectImage
  void projectHeader
}

function mapAnimationToTransitionClass(animationClass: AnimationClass): string {
  if (animationClass === 'fade-out') {
    return 'fade-out-transition'
  }
  if (animationClass === 'slide-up') {
    return 'slide-up-transition'
  }
  return 'fade-in-transition'
}

function applyAnimation(
  element: HTMLElement | null,
  animationClass: AnimationClass,
  duration: number,
): Promise<void> {
  if (element === null) {
    return Promise.resolve()
  }

  if (
    animationClass === 'fade-out' &&
    (element.classList.contains('header-content') || element.classList.contains('info-blocks'))
  ) {
    element.style.animation = 'none'
  }

  const transitionClass = mapAnimationToTransitionClass(animationClass)

  element.classList.add(transitionClass)

  window.requestAnimationFrame(() => {
    element.classList.add(animationClass)
  })

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve()
    }, duration)
  })
}

function animateWarpSpeed(
  starfield: StarfieldController,
  startValue: number,
  endValue: number,
  duration: number,
): void {
  const startTime = performance.now()

  const step = (currentTime: number): void => {
    const elapsedTime = currentTime - startTime
    const progress = Math.min(elapsedTime / duration, 1)

    const value = startValue + (endValue - startValue) * progress
    starfield.setWarpSpeed(value)

    if (progress < 1) {
      window.requestAnimationFrame(step)
    } else {
      starfield.setWarpSpeed(endValue)
    }
  }

  window.requestAnimationFrame(step)
}
