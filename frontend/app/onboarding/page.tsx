"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ChevronRight, ChevronLeft, Camera, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";

type Step = "photos" | "basics" | "bio" | "location" | "interests";

const INTERESTS = [
  "Travel", "Music", "Movies", "Reading", "Cooking", "Fitness",
  "Photography", "Art", "Gaming", "Sports", "Dancing", "Hiking",
  "Yoga", "Coffee", "Wine", "Food", "Pets", "Fashion",
  "Tech", "Nature", "Beach", "Mountains", "Concerts", "Theater",
];

const emptySlots = (): (string | null)[] => Array.from({ length: 6 }, () => null);

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<number | null>(null);

  const [currentStep, setCurrentStep] = useState<Step>("photos");
  const [isLoading, setIsLoading] = useState(false);

  const [photoSlots, setPhotoSlots] = useState<(string | null)[]>(emptySlots);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState("");

  const [basics, setBasics] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const steps: Step[] = ["photos", "basics", "bio", "location", "interests"];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const openPickerForSlot = (index: number) => {
    if (uploadingSlot !== null) return;
    pendingSlotRef.current = index;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const slot = pendingSlotRef.current;
    pendingSlotRef.current = null;
    if (!file || slot === null) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    setPhotoError("");
    setUploadingSlot(slot);
    try {
      const url = await uploadImageToCloudinary(file);
      setPhotoSlots((prev) => {
        const next = [...prev];
        next[slot] = url;
        return next;
      });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const photoUrlsOrdered = photoSlots.filter((u): u is string => u != null);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "photos":
        return photoUrlsOrdered.length >= 1;
      case "basics":
        return basics.name && basics.age && basics.gender;
      case "bio":
        return bio.length >= 10;
      case "location":
        return location.length >= 2;
      case "interests":
        return selectedInterests.length >= 3;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/profile/onboarding`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: basics.name.trim(),
            age: Number(basics.age),
            gender: basics.gender.toLowerCase(),
            bio: bio.trim(),
            city: location.trim(),
            interests: selectedInterests,
            photoUrls: photoUrlsOrdered,
          }),
        });

        if (!response.ok) {
          return;
        }

        router.push("/app");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-bold text-foreground">StealMyHeart</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Photos Step */}
          {currentStep === "photos" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Add your photos</h1>
              <p className="text-muted-foreground mb-8">
                Add at least 1 photo to continue. You can add up to 6 photos. The first slot is your
                main profile photo.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center relative overflow-hidden"
                  >
                    {photoSlots[index] ? (
                      <>
                        <img
                          src={photoSlots[index]!}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-foreground/80 rounded-full flex items-center justify-center hover:bg-foreground transition-colors"
                        >
                          <X className="w-4 h-4 text-background" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium">
                            Main
                          </span>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingSlot !== null}
                        onClick={() => openPickerForSlot(index)}
                        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
                      >
                        {uploadingSlot === index ? (
                          <span className="text-xs px-2">Uploading…</span>
                        ) : index === 0 ? (
                          <Camera className="w-8 h-8 mb-1" />
                        ) : (
                          <Plus className="w-6 h-6" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {photoError ? (
                <p className="text-sm text-destructive mb-4">{photoError}</p>
              ) : null}

              <p className="text-sm text-muted-foreground">
                Tip: Photos where your face is clearly visible get more matches!
              </p>
            </div>
          )}

          {/* Basics Step */}
          {currentStep === "basics" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Tell us about yourself</h1>
              <p className="text-muted-foreground mb-8">
                Basic info helps us find your best matches
              </p>

              <div className="flex flex-col gap-6 max-w-sm mx-auto">
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input
                    placeholder="Your first name"
                    value={basics.name}
                    onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label className="text-sm font-medium text-foreground">
                    Age
                  </label>
                  <Input
                    type="number"
                    placeholder="Your age"
                    min="18"
                    max="100"
                    value={basics.age}
                    onChange={(e) => setBasics({ ...basics, age: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label className="text-sm font-medium text-foreground">
                    I am a
                  </label>
                  <div className="flex gap-3">
                    {["Man", "Woman", "Other"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setBasics({ ...basics, gender: option })}
                        className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                          basics.gender === option
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio Step */}
          {currentStep === "bio" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Write your bio</h1>
              <p className="text-muted-foreground mb-8">
                Tell potential matches what makes you unique
              </p>

              <div className="max-w-md mx-auto">
                <textarea
                  placeholder="Write something interesting about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full h-40 p-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>Min 10 characters</span>
                  <span>{bio.length}/500</span>
                </div>
              </div>
            </div>
          )}

          {/* Location Step */}
          {currentStep === "location" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Where are you located?</h1>
              <p className="text-muted-foreground mb-8">
                We&apos;ll show you people nearby
              </p>

              <div className="max-w-sm mx-auto">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your city"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <button
                  type="button"
                  className="mt-4 text-sm text-primary hover:underline flex items-center gap-2 mx-auto"
                >
                  <MapPin className="w-4 h-4" />
                  Use my current location
                </button>
              </div>
            </div>
          )}

          {/* Interests Step */}
          {currentStep === "interests" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Pick your interests</h1>
              <p className="text-muted-foreground mb-8">
                Select 3-5 interests to help find your matches
              </p>

              <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      selectedInterests.includes(interest)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Selected: {selectedInterests.length}/5
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              "Creating profile..."
            ) : currentIndex === steps.length - 1 ? (
              "Complete Profile"
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
