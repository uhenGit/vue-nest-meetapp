import { toRaw } from 'vue';

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
export const toRawDeep = (prop) => {
	const rawVal = toRaw(prop);

	if (Array.isArray(rawVal)) {
		return rawVal.map(toRawDeep);
	}

	if (rawVal === null) {
		return null;
	}

	if (typeof rawVal === 'object') {
		const entries = Object
			.entries(rawVal)
			.map(([key, val]) => [key, toRawDeep(val)]);

		return Object.fromEntries(entries);
	}

	return rawVal;
}