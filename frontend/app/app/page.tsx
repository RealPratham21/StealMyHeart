"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, X, MapPin, Sparkles, Star } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type SwipeProfile = {
  id: string;
  first_name: string | null;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  city: string | null;
  interests: string[];
  photo_urls: string[];
};

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<"like" | "pass" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentProfile = profiles[currentIndex];
  const visibleCount = profiles.length;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/swipe/profiles?limit=10`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Unable to load profiles.");
      }
      const data = (await response.json()) as { profiles?: SwipeProfile[] };
      setProfiles(data.profiles ?? []);
      setCurrentIndex(0);
    } catch {
      setError("Could not load swipe profiles.");
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = async (action: "like" | "pass" | "superlike") => {
    if (!currentProfile) return;
    setLastAction(action === "superlike" ? "like" : action);

    try {
      const direction = action === "like" || action === "superlike";
      await fetch(`${API_BASE_URL}/swipe/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ swipedId: currentProfile.id, direction }),
      });
    } catch {
      // Silently fail swipe recording - UI still advances
    }

    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        void fetchProfiles();
      }
      setLastAction(null);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading profiles...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{error}</h2>
          <button
            onClick={() => void fetchProfiles()}
            className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No profiles right now</h2>
          <p className="text-muted-foreground">Try again in a moment.</p>
          <button
            onClick={() => void fetchProfiles()}
            className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    currentProfile.first_name?.trim() ||
    currentProfile.full_name?.trim()?.split(" ")[0] ||
    "Profile";

  const photo = currentProfile.photo_urls[0] || "/placeholder-user.jpg";
  const location = currentProfile.city || "India";

  return (
    <div className="flex flex-col items-center">
      {/* Profile Card */}
      <div className="w-full max-w-md">
        <div
          className={`relative bg-card rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
            lastAction === "like"
              ? "rotate-6 translate-x-4"
              : lastAction === "pass"
              ? "-rotate-6 -translate-x-4"
              : ""
          }`}
        >
          {/* Photo */}
          <div className="relative aspect-[3/4]">
            <img
              src={photo}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

            {/* Like/Pass indicators */}
            {lastAction && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`px-8 py-4 rounded-xl border-4 font-bold text-3xl rotate-[-15deg] ${
                    lastAction === "like"
                      ? "border-green-500 text-green-500"
                      : "border-red-500 text-red-500"
                  }`}
                >
                  {lastAction === "like" ? "LIKE" : "NOPE"}
                </div>
              </div>
            )}

            {/* Profile info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold">
                    {displayName}
                    {typeof currentProfile.age === "number" ? `, ${currentProfile.age}` : ""}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-white/80">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-white/90 line-clamp-2">
                {currentProfile.bio || "No bio yet."}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {currentProfile.interests.slice(0, 5).map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => handleAction("pass")}
            className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => handleAction("superlike")}
            className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all"
          >
            <Star className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleAction("like")}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-lg"
          >
            <Heart className="w-8 h-8" />
          </button>
        </div>

        {/* Profile counter */}
        <p className="text-center text-muted-foreground text-sm mt-4">
          {Math.min(currentIndex + 1, visibleCount)} of {visibleCount} profiles
        </p>
      </div>
    </div>
  );
}
