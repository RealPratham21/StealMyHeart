"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import { displayName, fetchMe, type MeUser } from "@/lib/me";

const INTERESTS = [
  "Travel", "Music", "Movies", "Reading", "Cooking", "Fitness",
  "Photography", "Art", "Gaming", "Sports", "Dancing", "Hiking",
  "Yoga", "Coffee", "Wine", "Food", "Pets", "Fashion",
  "Tech", "Nature", "Beach", "Mountains", "Concerts", "Theater",
];

type Gender = "man" | "woman" | "other";

type EditableProfile = {
  name: string;
  age: number;
  gender: Gender;
  location: string;
  bio: string;
  photos: string[];
  interests: string[];
};

function userToEditable(user: MeUser): EditableProfile {
  const name =
    user.first_name?.trim() ||
    user.full_name?.trim()?.split(/\s+/)[0] ||
    "";
  return {
    name,
    age: user.age ?? 18,
    gender: (user.gender as Gender) || "man",
    location: user.city?.trim() || "",
    bio: user.bio?.trim() || "",
    photos: [...(user.photo_urls ?? [])].slice(0, 6),
    interests: [...(user.interests ?? [])],
  };
}

function genderLabel(g: string | null): string {
  if (!g) return "—";
  if (g === "man") return "Man";
  if (g === "woman") return "Woman";
  if (g === "other") return "Other";
  return g;
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<EditableProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    fetchMe()
      .then((user) => {
        if (cancelled) return;
        if (!user) {
          setLoadError("Could not load your profile. Try signing in again.");
          return;
        }
        setMe(user);
        const initial = userToEditable(user);
        setProfile(initial);
        setEditedProfile(initial);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your profile.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!editedProfile) return;
    setSaveError("");
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: editedProfile.name.trim(),
          age: editedProfile.age,
          gender: editedProfile.gender,
          bio: editedProfile.bio.trim(),
          city: editedProfile.location.trim(),
          interests: editedProfile.interests,
          photoUrls: editedProfile.photos,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setSaveError(typeof data.detail === "string" ? data.detail : "Could not save profile.");
        return;
      }
      const refreshed = await fetchMe();
      if (refreshed) {
        setMe(refreshed);
        const next = userToEditable(refreshed);
        setProfile(next);
        setEditedProfile(next);
      }
      window.dispatchEvent(new Event("stealmyheart:profile-updated"));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setEditedProfile(profile);
    setSaveError("");
    setIsEditing(false);
  };

  const openAddPhoto = () => {
    if (uploadingPhoto || !editedProfile || editedProfile.photos.length >= 6) return;
    fileInputRef.current?.click();
  };

  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editedProfile) return;
    if (!file.type.startsWith("image/")) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setEditedProfile({
        ...editedProfile,
        photos: [...editedProfile.photos, url].slice(0, 6),
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      photos: editedProfile.photos.filter((_, i) => i !== index),
    });
  };

  const toggleInterest = (interest: string) => {
    if (!editedProfile) return;
    if (editedProfile.interests.includes(interest)) {
      setEditedProfile({
        ...editedProfile,
        interests: editedProfile.interests.filter((i) => i !== interest),
      });
    } else if (editedProfile.interests.length < 5) {
      setEditedProfile({
        ...editedProfile,
        interests: [...editedProfile.interests, interest],
      });
    }
  };

  if (loadError || !profile || !editedProfile || !me) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-muted-foreground">{loadError || "Loading profile…"}</p>
      </div>
    );
  }

  const view = isEditing ? editedProfile : profile;

  return (
    <div className="max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoFile}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
        {isEditing ? (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="w-4 h-4 mr-2" />
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
            {saveError ? <p className="text-sm text-destructive max-w-xs text-right">{saveError}</p> : null}
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="text-sm text-muted-foreground mb-6">
          Signed in as <span className="text-foreground font-medium">{displayName(me)}</span>
          {me.email ? ` · ${me.email}` : null}
        </p>
      ) : null}

      {/* Photos Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Photos</h2>
        <div className="grid grid-cols-3 gap-3">
          {view.photos.map((photo, index) => (
            <div key={`${photo}-${index}`} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-foreground/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-background" />
                </button>
              )}
              {index === 0 && view.photos.length > 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                  Main
                </span>
              )}
            </div>
          ))}
          {isEditing && editedProfile.photos.length < 6 && (
            <button
              type="button"
              onClick={openAddPhoto}
              disabled={uploadingPhoto}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">{uploadingPhoto ? "Uploading…" : "Add Photo"}</span>
            </button>
          )}
        </div>
      </section>

      {/* Basic Info */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Basic Info</h2>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            {isEditing ? (
              <Input
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="max-w-[200px] text-right"
              />
            ) : (
              <span className="text-foreground font-medium">{profile.name || displayName(me)}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Age</span>
            {isEditing ? (
              <Input
                type="number"
                value={editedProfile.age}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    age: parseInt(e.target.value, 10) || 18,
                  })
                }
                className="max-w-[100px] text-right"
                min={18}
                max={100}
              />
            ) : (
              <span className="text-foreground font-medium">{profile.age}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Gender</span>
            {isEditing ? (
              <div className="flex gap-2">
                {(["man", "woman", "other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEditedProfile({ ...editedProfile, gender: g })}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      editedProfile.gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {genderLabel(g)}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-foreground font-medium">{genderLabel(me.gender)}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </span>
            {isEditing ? (
              <Input
                value={editedProfile.location}
                onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                className="max-w-[200px] text-right"
              />
            ) : (
              <span className="text-foreground font-medium">{profile.location || "—"}</span>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">About Me</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          {isEditing ? (
            <textarea
              value={editedProfile.bio}
              onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
              maxLength={500}
              className="w-full h-32 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              placeholder="Write something about yourself..."
            />
          ) : (
            <p className="text-foreground whitespace-pre-wrap">{profile.bio || "—"}</p>
          )}
        </div>
        {isEditing && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {editedProfile.bio.length}/500
          </p>
        )}
      </section>

      {/* Interests */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Interests</h2>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowInterestsModal(true)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {view.interests.length ? (
            view.interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm"
              >
                {interest}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      </section>

      {/* Interests Modal */}
      {showInterestsModal && editedProfile && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Edit Interests</h3>
              <button
                type="button"
                onClick={() => setShowInterestsModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
              Select up to 5 interests ({editedProfile.interests.length}/5 selected)
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    editedProfile.interests.includes(interest)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => setShowInterestsModal(false)}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
