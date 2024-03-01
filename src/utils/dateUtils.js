export const getDateStr = (dateStr) => {
	const dateObj = new Date(dateStr);
	const hours = normalizeUnit(dateObj.getHours());
	const minutes = normalizeUnit(dateObj.getMinutes());
	const { year, month, day } = getDate(dateObj);

	return {
		time: `${hours}:${minutes}`,
		date: `${year}-${month}-${day}`,
	};
}

export const getDate = (dateObj) => {
	return {
		year: dateObj.getFullYear(),
		month: normalizeUnit(dateObj.getMonth() + 1),
		day: normalizeUnit(dateObj.getDate()),
	};
}

const normalizeUnit = (unit) => unit < 10 ? `0${unit}` : `${unit}`;