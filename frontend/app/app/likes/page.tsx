"use client";

import { Heart, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// This section is intentionally blank as per user request
// You would typically fetch likes from your backend

export default function LikesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          See Who Likes You
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Upgrade to StealMyHeart Gold to see everyone who has already swiped right on you.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-muted rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 blur-sm" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-muted rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 blur-sm" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-muted rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 blur-sm" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">12+ people</span> have liked your profile
          </p>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Gold
        </Button>
      </div>
    </div>
  );
}
