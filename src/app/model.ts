import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

export async function getModelPrediction(payload: any) {
  const res = await fetchWithAuth(`${API_BASE_URL}/model/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
