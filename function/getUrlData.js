export const urlData = async (day) => {
  return [
    {
      url: process.env.NSE_URL_ADVANCE,
      buttonId: "#Advance-download",
      fileName: "Advance.csv",
      sheetName: [`${day}_Advance_EQ`, `${day}_Advance_BE`],
    },
    {
      url: process.env.NSE_URL_DECLINE,
      buttonId: "#Decline-download",
      fileName: "Decline.csv",
      sheetName: `${day}_Decline`,
    },
  ];
};
