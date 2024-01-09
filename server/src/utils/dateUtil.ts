export const todayPlusOneWeek = () => {
  const hour = 3600000;

  return new Date(Date.now() + 24 * 7 * hour);
};
