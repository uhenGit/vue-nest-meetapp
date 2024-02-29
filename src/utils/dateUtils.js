export const getFullTime = (dateStr) => {
	const dateObj = new Date(dateStr);
	const hours = normalizeUnits(dateObj.getHours());
	const minutes = normalizeUnits(dateObj.getMinutes());

	return `${hours}:${minutes}`;
}

const normalizeUnits = (unit) => unit < 10 ? `0${unit}` : `${unit}`;