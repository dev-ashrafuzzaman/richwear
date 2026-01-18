export const calculateAttendance = ({
  punchIn,
  punchOut,
  officeStartHour = 10,
}) => {
  const start = new Date(punchIn);
  const end = new Date(punchOut);

  const workingMinutes = Math.max(
    Math.floor((end - start) / 60000),
    0
  );

  const officeStart = new Date(start);
  officeStart.setHours(officeStartHour, 0, 0, 0);

  const lateMinutes =
    start > officeStart
      ? Math.floor((start - officeStart) / 60000)
      : 0;

  const status = lateMinutes > 0 ? "late" : "present";

  return { workingMinutes, lateMinutes, status };
};
