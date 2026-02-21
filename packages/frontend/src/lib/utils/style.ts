export function onErrorImageDisplayNone(el: Element) {
	if (el instanceof HTMLImageElement) {
		el.style.display = 'none';
	}
}
