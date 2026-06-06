"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, Lock, Sparkles, User, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import Script from "next/script";

interface Like {
  id: string;
  firstName: string;
  photoUrl: string | null;
  bio?: string;
  city?: string;
  interests?: string[];
  isBlurred?: boolean;
}

export default function LikesPage() {
  const [likes, setLikes] = useState<Like[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchLikes = useCallback(async () => {
    try {
      const data = await apiFetch("/matches/likes-me");
      setLikes(data.likes);
      setIsPremium(data.isPremium);
    } catch (err) {
      console.error("Failed to fetch likes:", err);
      toast.error("Could not load likes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handleUpgrade = async () => {
    setPaymentLoading(true);
    try {
      // 1. Create order on backend
      const order = await apiFetch("/payments/create-order", { method: "POST" });
      
      // 2. Configure Razorpay options
      // Note: When using order_id, amount and currency are not required 
      // as they are fetched from the order record on Razorpay's server.
      const options = {
        key: order.keyId,
        name: "StealMyHeart Gold",
        description: "30 Days Premium Subscription",
        order_id: order.orderId,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            await apiFetch("/payments/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            toast.success("Welcome to Gold! ✨");
            fetchLikes(); // Refresh to unlock
          } catch (err: any) {
            console.error("Verification error:", err);
            toast.error(err.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: "StealMyHeart User",
          // You can add more prefill data here if you fetch the user profile
        },
        theme: {
          color: "#EC4899",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      toast.error(err.message || "Could not start payment. Please try again.");
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading your fans...</div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
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
              {likes.slice(0, 3).map((like, i) => (
                <div key={i} className="relative">
                  <div className="w-16 h-16 bg-muted rounded-full overflow-hidden border-2 border-background">
                    {like.photoUrl ? (
                      <img src={like.photoUrl} alt="blurred" className="w-full h-full object-cover blur-md grayscale opacity-50" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 blur-sm" />
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {likes.length === 0 && [1, 2, 3].map((_, i) => (
                 <div key={i} className="w-16 h-16 bg-muted rounded-full blur-sm" />
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{likes.length}+ people</span> have liked your profile
            </p>
          </div>

          <Button 
            onClick={handleUpgrade} 
            disabled={paymentLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:scale-105 transition-transform"
          >
            {paymentLoading ? (
              "Initializing..."
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Upgrade to Gold for ₹100
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-yellow-400/10 rounded-xl flex items-center justify-center text-yellow-500">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gold Members Only</h1>
          <p className="text-sm text-muted-foreground">People who are already interested in you</p>
        </div>
      </div>

      {likes.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No likes yet. Keep swiping to get noticed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {likes.map((like) => (
            <div key={like.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer">
              <div className="aspect-[3/4] relative">
                <img 
                  src={like.photoUrl || "/placeholder-avatar.png"} 
                  alt={like.firstName} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {like.firstName}
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Heart className="w-2 h-2 text-white fill-current" />
                    </div>
                  </h3>
                  {like.city && (
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {like.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                  {like.bio || "No bio yet."}
                </p>
                <div className="flex flex-wrap gap-1">
                  {like.interests?.slice(0, 2).map((interest, i) => (
                    <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
