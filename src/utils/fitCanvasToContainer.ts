export function fitCanvasToContainer(
  canvas: HTMLCanvasElement | null,
  container?: HTMLElement | null,
): void {
  if (!canvas) { return; }
  const target = container ?? canvas.parentElement;
  if (!target) { return; }

  const bufferWidth = canvas.width || canvas.getBoundingClientRect().width;
  const bufferHeight = canvas.height || canvas.getBoundingClientRect().height;
  if (!bufferWidth || !bufferHeight) { return; }

  const availableWidth = target.clientWidth || target.getBoundingClientRect().width;
  const availableHeight = target.clientHeight || target.getBoundingClientRect().height;
  if (!availableWidth || !availableHeight) { return; }

  const scale = Math.min(1, availableWidth / bufferWidth, availableHeight / bufferHeight);

  if (scale < 1) {
    canvas.style.width = `${bufferWidth * scale}px`;
    canvas.style.height = `${bufferHeight * scale}px`;
  } else {
    canvas.style.width = "";
    canvas.style.height = "";
  }
}
