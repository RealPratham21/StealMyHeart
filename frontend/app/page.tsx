"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Sparkles, Users, MessageCircle, Shield, ChevronRight, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <span className="text-xl font-bold text-foreground">StealMyHeart</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Stories
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                How It Works
              </Link>
              <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                Stories
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-foreground">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Where love stories begin</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
            Find Someone Who
            <span className="block text-primary">Steals Your Heart</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Discover meaningful connections with people who truly understand you. 
            Swipe, match, and let your love story unfold.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Start Your Journey
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border text-foreground hover:bg-secondary">
                Learn More
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm">10M+ Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm">500K+ Matches Daily</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">Verified Profiles</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Heart,
      title: "Smart Matching",
      description: "Our algorithm learns your preferences to show you the most compatible profiles."
    },
    {
      icon: MessageCircle,
      title: "Real Conversations",
      description: "Connect through meaningful messages with people who share your interests."
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Your privacy matters. Verified profiles and secure messaging keep you protected."
    },
    {
      icon: Sparkles,
      title: "Icebreakers",
      description: "Fun prompts and games help you start conversations naturally."
    }
  ];

  return (
    <section id="features" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Why Choose StealMyHeart?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to find your perfect match, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background p-6 rounded-2xl border border-border hover:border-primary/30 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Add your photos, write a bio, and share what makes you unique."
    },
    {
      number: "02",
      title: "Discover People",
      description: "Swipe through profiles and find people who catch your eye."
    },
    {
      number: "03",
      title: "Make a Connection",
      description: "When you both swipe right, it&apos;s a match! Start chatting."
    },
    {
      number: "04",
      title: "Fall in Love",
      description: "Take your connection offline and let your story begin."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Finding love has never been easier. Just four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-bold text-primary/10 mb-4">{step.number}</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 w-1/2 border-t-2 border-dashed border-primary/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah & Michael",
      location: "New York, NY",
      quote: "We matched on StealMyHeart two years ago and now we&apos;re engaged! This app truly changed our lives.",
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop"
    },
    {
      name: "Emma & James",
      location: "Los Angeles, CA",
      quote: "I was skeptical about dating apps, but StealMyHeart felt different. Found my soulmate within weeks!",
      image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop"
    },
    {
      name: "Olivia & David",
      location: "Chicago, IL",
      quote: "The matching algorithm really works. We have so much in common and it&apos;s been an incredible journey.",
      image: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=400&h=400&fit=crop"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Real Love Stories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of couples who found their perfect match on StealMyHeart.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background p-8 rounded-2xl border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Heart key={i} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Heart className="w-16 h-16 text-primary-foreground/80 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4 text-balance">
          Ready to Find Your Person?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto text-pretty">
          Join millions of singles who are already swiping their way to love. 
          Your perfect match could be just one swipe away.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg">
            Create Free Account
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="text-lg font-bold text-background">StealMyHeart</span>
          </div>
          
          <div className="flex items-center gap-6 text-background/60">
            <Link href="#" className="hover:text-background transition-colors text-sm">Privacy</Link>
            <Link href="#" className="hover:text-background transition-colors text-sm">Terms</Link>
            <Link href="#" className="hover:text-background transition-colors text-sm">Safety</Link>
            <Link href="#" className="hover:text-background transition-colors text-sm">Support</Link>
          </div>
          
          <p className="text-background/60 text-sm">
            &copy; 2026 StealMyHeart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
