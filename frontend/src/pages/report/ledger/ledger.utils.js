export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const [day, month, year] = dateString.split("-");
  if (!day || !month || !year) return dateString;
  return `${day}/${month}/${year}`;
};

export const formatToApiDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};
