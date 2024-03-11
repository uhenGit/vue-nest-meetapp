export const setPosition = (event) => {
	const coords = {
		left: `${event.x}px`,
		top: `${event.y}px`,
	};
	const documentWidth = document.documentElement.clientWidth;

	if ((event.x + 200) > documentWidth) {
		coords.left = `${event.x - (200 - (documentWidth - event.x))}px`;
	}

	return coords;
 }