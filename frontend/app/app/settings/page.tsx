"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Shield,
  Eye,
  MapPin,
  Heart,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SettingSection = {
  title: string;
  items: {
    icon: React.ElementType;
    label: string;
    description?: string;
    action?: "toggle" | "link" | "select";
    value?: boolean | string;
    href?: string;
  }[];
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    showOnlineStatus: true,
    showDistance: true,
    darkMode: false,
    ageRange: "18-35",
    maxDistance: "50 miles",
  });

  const settingsSections: SettingSection[] = [
    {
      title: "Discovery",
      items: [
        {
          icon: MapPin,
          label: "Maximum Distance",
          description: settings.maxDistance,
          action: "select",
        },
        {
          icon: Heart,
          label: "Age Range",
          description: settings.ageRange,
          action: "select",
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Push Notifications",
          description: "New matches, messages, and likes",
          action: "toggle",
          value: settings.pushNotifications,
        },
        {
          icon: Smartphone,
          label: "Email Notifications",
          description: "Weekly digest and updates",
          action: "toggle",
          value: settings.emailNotifications,
        },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: Eye,
          label: "Show Online Status",
          description: "Let others see when you're active",
          action: "toggle",
          value: settings.showOnlineStatus,
        },
        {
          icon: MapPin,
          label: "Show Distance",
          description: "Display how far you are from others",
          action: "toggle",
          value: settings.showDistance,
        },
        {
          icon: Shield,
          label: "Blocked Users",
          action: "link",
          href: "#",
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: settings.darkMode ? Moon : Sun,
          label: "Dark Mode",
          description: "Use dark theme",
          action: "toggle",
          value: settings.darkMode,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          action: "link",
          href: "#",
        },
        {
          icon: FileText,
          label: "Terms of Service",
          action: "link",
          href: "#",
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          action: "link",
          href: "#",
        },
      ],
    },
  ];

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="flex flex-col gap-6">
        {settingsSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {section.title}
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {section.items.map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-4 ${
                    index < section.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.action === "toggle" && (
                    <button
                      onClick={() => {
                        const key = item.label
                          .replace(/\s+/g, "")
                          .replace(/^./, (c) => c.toLowerCase()) as keyof typeof settings;
                        handleToggle(key);
                      }}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        item.value ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-background rounded-full shadow transition-transform ${
                          item.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  )}

                  {item.action === "link" && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}

                  {item.action === "select" && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>

        {/* Account Actions */}
        <div className="text-center">
          <button className="text-sm text-muted-foreground hover:text-destructive transition-colors">
            Delete Account
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground">
          StealMyHeart v1.0.0
        </p>
      </div>
    </div>
  );
}
