"use client";

import { useState } from "react";
import { Heart, X, MapPin, Sparkles, RotateCcw, Star } from "lucide-react";

const profiles = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    location: "New York, NY",
    bio: "Coffee enthusiast, book lover, and adventure seeker. Looking for someone to explore the city with!",
    interests: ["Travel", "Reading", "Coffee", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    ],
    distance: "3 miles away",
  },
  {
    id: 2,
    name: "Sophia",
    age: 24,
    location: "Brooklyn, NY",
    bio: "Artist by day, foodie by night. Let's grab tacos and talk about life.",
    interests: ["Art", "Food", "Music", "Photography"],
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    ],
    distance: "5 miles away",
  },
  {
    id: 3,
    name: "Olivia",
    age: 28,
    location: "Manhattan, NY",
    bio: "Tech professional who loves yoga and outdoor adventures. Dog mom to a golden retriever named Max.",
    interests: ["Tech", "Yoga", "Dogs", "Hiking"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    ],
    distance: "2 miles away",
  },
  {
    id: 4,
    name: "Isabella",
    age: 25,
    location: "Queens, NY",
    bio: "Dancing through life one salsa step at a time. Looking for a partner in crime and on the dance floor.",
    interests: ["Dancing", "Travel", "Wine", "Concerts"],
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
    ],
    distance: "7 miles away",
  },
];

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<"like" | "pass" | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const currentProfile = profiles[currentIndex];

  const handleAction = (action: "like" | "pass" | "superlike") => {
    setLastAction(action === "superlike" ? "like" : action);
    
    // Simulate random match on like
    if (action === "like" && Math.random() > 0.7) {
      setTimeout(() => setShowMatch(true), 300);
    }

    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // Loop back
      }
      setLastAction(null);
    }, 300);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No more profiles
          </h2>
          <p className="text-muted-foreground">
            Check back later for new people in your area
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Match Modal */}
      {showMatch && (
        <div className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl p-8 max-w-md w-full text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Your photo"
                className="w-20 h-20 rounded-full object-cover border-4 border-primary"
              />
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <img
                src={currentProfile.photos[0]}
                alt={currentProfile.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-primary"
              />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              It&apos;s a Match!
            </h2>
            <p className="text-muted-foreground mb-6">
              You and {currentProfile.name} liked each other
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowMatch(false)}
                className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Send a Message
              </button>
              <button
                onClick={() => setShowMatch(false)}
                className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}

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
              src={currentProfile.photos[0]}
              alt={currentProfile.name}
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
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-white/80">
                    <MapPin className="w-4 h-4" />
                    <span>{currentProfile.distance}</span>
                  </div>
                </div>
              </div>
              
              <p className="mt-4 text-white/90 line-clamp-2">{currentProfile.bio}</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {currentProfile.interests.map((interest) => (
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
            onClick={handleUndo}
            className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
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
          {currentIndex + 1} of {profiles.length} profiles
        </p>
      </div>
    </div>
  );
}
