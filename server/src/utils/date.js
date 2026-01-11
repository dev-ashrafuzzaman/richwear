const getBDDate = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 6 * 60 * 60000);
};

export const nowDate = () => {
  return getBDDate();
};


export const nowISODateTime = () => {
  return getBDDate().toISOString();
};


export const nowISODate = () => {
  return getBDDate().toISOString().split("T")[0];
};
