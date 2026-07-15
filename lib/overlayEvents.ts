export const CLOSE_OVERLAYS_EVENT = "brainstats:close-overlays";

export function dispatchCloseOverlays(exceptId?: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.dispatchEvent(
    new CustomEvent(CLOSE_OVERLAYS_EVENT, {
      detail: { exceptId },
    })
  );
}

export function subscribeCloseOverlays(
  overlayId: string,
  onClose: () => void
) {
  function handleClose(event: Event) {
    const exceptId = (event as CustomEvent<{ exceptId?: string }>).detail
      ?.exceptId;

    if (exceptId && exceptId === overlayId) {
      return;
    }

    onClose();
  }

  document.addEventListener(CLOSE_OVERLAYS_EVENT, handleClose);

  return () => {
    document.removeEventListener(CLOSE_OVERLAYS_EVENT, handleClose);
  };
}
