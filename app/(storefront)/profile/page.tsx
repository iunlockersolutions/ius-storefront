import Link from "next/link"
import { redirect } from "next/navigation"

import { ChevronRight, Heart, MapPin, Package, Star } from "lucide-react"

import { SecuritySection } from "@/components/storefront/profile/security-section"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getFullProfile } from "@/lib/actions/profile"
import { getServerSession } from "@/lib/auth/rbac"

import { PreferencesForm } from "./preferences-form"
import { ProfileForm } from "./profile-form"

export const metadata = {
  title: "My Profile",
  description: "Manage your account settings and preferences",
}

export default async function ProfilePage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/sign-in?callbackUrl=/profile")
  }

  const userProfile = await getFullProfile()

  if (!userProfile) {
    redirect("/auth/sign-in")
  }

  const quickLinks = [
    {
      icon: Package,
      label: "My Orders",
      description: "View and track your orders",
      href: "/orders",
    },
    {
      icon: MapPin,
      label: "Address Book",
      description: "Manage your addresses",
      href: "/profile/addresses",
    },
    {
      icon: Heart,
      label: "Favorites",
      description: "View your saved items",
      href: "/favorites",
    },
    {
      icon: Star,
      label: "My Reviews",
      description: "View and manage your reviews",
      href: "/profile/reviews",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, addresses, and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={userProfile} />
            </CardContent>
          </Card>

          {/* Security Section (Password & Passkeys) */}
          <SecuritySection
            userEmail={userProfile.email}
            userName={userProfile.name || undefined}
            lastPasswordChange={userProfile.lastPasswordChange}
          />

          {/* Marketing Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Manage your email notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesForm
                marketingOptIn={userProfile.profile?.marketingOptIn ?? false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{link.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
