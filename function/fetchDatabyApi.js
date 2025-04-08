import axios from "axios";
import { uploadCSVToGoogleSheet } from "./csvUpload.js";

export async function fetchNSEData() {
  // return uploadCSVToGoogleSheet("Advance.csv", "1_Hx8BjKRwkdsBURgoSrKcj1cBKNuEHk4uGU1eLLIbh8", "ADVANCE");
      const response = await axios.get(
        "https://www.nseindia.com/api/live-analysis-advance",
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Referer": "https://www.nseindia.com/market-data/advance",
          //   "Cookie": "nseappid=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkubnNlIiwiYXVkIjoiYXBpLm5zZSIsImlhdCI6MTc0Mzc2OTg5MCwiZXhwIjoxNzQzNzc3MDkwfQ.VBHqgc0z16_a2u_j3F-0IlFsp2Bcg4WVTMoqoSAXJzc; bm_sv=BB5E29061C9D7BFF69E361963090E9B6~YAAQ3QVaaGnlRP+VAQAAmfXIAButokJNqPzNoo6+Mr0sZyj+hsZlMXcL1UC5UnpglWjSj+kZX+BeSH5gSYqcWpEhbvUxqyTJkVhCrruVnVGbAQqKXeAajMBUZtPGleTPx0p6dVHcvEr6cElNs6C3037amts7TIBZCTI63JAmOWN1ZMl7xy9xZ3/MKtXj7ubZfZwLzu4q3r9nsWdt5wFXCRatyLIHYa5uqEnJS5gP1EXQfoGkfppDsKb8wJUwZYbrgYc=~1;", // Add all necessary cookies
          },
        }
      ).then((data)=>{
          console.log("Data fetched successfully:", data.data);
          // return data.data;
      }).catch((error) => {
        console.error("Error fetching data:", error.message);
      }
  )

  // console.log(response.data);
}
