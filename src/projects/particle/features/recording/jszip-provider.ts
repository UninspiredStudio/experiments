import JSZip from 'jszip'

export type JSZipConstructor = typeof JSZip

export function createJSZipInstance(): JSZipConstructor {
  return JSZip
}
