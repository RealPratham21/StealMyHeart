import { API_BASE_URL } from "@/lib/api";

export type MeUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  dob: string | null;
  phone: string | null;
  interests: string[] | null;
  photo_urls: string[] | null;
};

export async function fetchMe(): Promise<MeUser | null> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: MeUser };
  return data.user ?? null;
}

export function primaryPhotoUrl(user: MeUser | null): string {
  const url = user?.photo_urls?.[0];
  if (url) return url;
  return "/placeholder-user.jpg";
}

export function displayName(user: MeUser | null): string {
  if (!user) return "Member";
  return user.first_name?.trim() || user.full_name?.trim() || user.email;
}
