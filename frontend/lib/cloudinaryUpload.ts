import { API_BASE_URL } from "@/lib/api";

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: string;
  signature: string;
};

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch(`${API_BASE_URL}/uploads/signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ folder: "stealmyheart/profiles" }),
  });

  if (!sigRes.ok) {
    const err = (await sigRes.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? "Could not prepare upload.");
  }

  const { cloudName, apiKey, folder, timestamp, signature } =
    (await sigRes.json()) as SignatureResponse;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );

  if (!uploadRes.ok) {
    throw new Error("Upload to Cloudinary failed.");
  }

  const data = (await uploadRes.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Invalid response from Cloudinary.");
  }

  return data.secure_url;
}
