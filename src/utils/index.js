export const fancyDateNoTime = (date) => {
  const date_ = new Date(date)
    .toLocaleString()
    .replace(/\//g, "-")
    .split(",")[0]
    .split("-")
    .reverse()
    .join("-");

  return `${date_}`;
};
