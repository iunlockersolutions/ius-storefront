"use client"

import { Suspense } from "react"

import { AuthPageSkeleton } from "@/app/auth/_components/auth-container"

import RegisterForm from "./register.form"

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
