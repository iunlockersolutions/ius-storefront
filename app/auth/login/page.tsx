"use client"

import { Suspense } from "react"

import { AuthPageSkeleton } from "@/app/auth/_components/auth-container"

import LoginForm from "./login.form"

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
