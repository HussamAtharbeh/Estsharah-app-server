import axios from "axios";
import { AppError } from "../utils/AppError.js";

export async function getNews(req, res) {
  try {
    const response = await axios.get(
      "https://gnews.io/api/v4/search",
      {
        params: {
          q: "الأردن",
          lang: "ar",
          country: "jo",
          max: 10,
          apikey: process.env.GNEWS_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "GNews Error:",
      error.response?.data || error.message
    );

    throw new AppError(
      "تعذر جلب الأخبار حالياً",
      502
    );
  }
}