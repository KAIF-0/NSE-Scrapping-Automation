export const filterCSVData = (rows, fileName) => {
  // console.log(rows, fileName);
  if (fileName.split(".")[0].toLowerCase().includes("decline")) {
    return rows.filter((row) => row["Series "] === "EQ");
  }

  if (fileName.split(".")[0].toLowerCase().includes("advance")) {
    return rows.filter((row) => {
      const change = parseFloat(row["%chng "]);
      const series = row["Series "];
      if (!change || isNaN(change)) return false;

      return (
        (series === "EQ" && change > 4) ||
        (["BE", "SM", "ST"].includes(series) && change > 4)
      );
    });
  }

  return rows;
};
