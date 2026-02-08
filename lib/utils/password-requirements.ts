/**
 * Password Requirements Configuration
 */
export const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
} as const

/**
 * Special characters allowed in passwords
 */
export const specialCharacters = "!@#$%^&*()_+-=[]{}|;:,.<>?"

/**
 * Check if password meets minimum length
 */
export function hasMinLength(password: string): boolean {
  return password.length >= passwordRequirements.minLength
}

/**
 * Check if password contains uppercase letter
 */
export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password)
}

/**
 * Check if password contains lowercase letter
 */
export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password)
}

/**
 * Check if password contains a number
 */
export function hasNumber(password: string): boolean {
  return /[0-9]/.test(password)
}

/**
 * Check if password contains special character
 */
export function hasSpecialChar(password: string): boolean {
  return /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
}

/**
 * Calculate password strength (0-5)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0

  if (hasMinLength(password)) strength++
  if (hasUppercase(password)) strength++
  if (hasLowercase(password)) strength++
  if (hasNumber(password)) strength++
  if (hasSpecialChar(password)) strength++

  return strength
}

/**
 * Get strength label based on score
 */
export function getStrengthLabel(strength: number): {
  label: string
  color: string
} {
  switch (strength) {
    case 0:
    case 1:
      return { label: "Very Weak", color: "bg-red-500" }
    case 2:
      return { label: "Weak", color: "bg-orange-500" }
    case 3:
      return { label: "Fair", color: "bg-yellow-500" }
    case 4:
      return { label: "Strong", color: "bg-lime-500" }
    case 5:
      return { label: "Very Strong", color: "bg-green-500" }
    default:
      return { label: "Unknown", color: "bg-gray-500" }
  }
}

/**
 * Validate password against all requirements
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!hasMinLength(password)) {
    errors.push(
      `Password must be at least ${passwordRequirements.minLength} characters`,
    )
  }
  if (passwordRequirements.requireUppercase && !hasUppercase(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (passwordRequirements.requireLowercase && !hasLowercase(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (passwordRequirements.requireNumber && !hasNumber(password)) {
    errors.push("Password must contain at least one number")
  }
  if (passwordRequirements.requireSpecialChar && !hasSpecialChar(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if password contains user info (email or name)
 */
export function containsUserInfo(
  password: string,
  email?: string,
  name?: string,
): boolean {
  const lowerPassword = password.toLowerCase()

  if (email) {
    const emailParts = email.toLowerCase().split("@")
    if (emailParts[0] && lowerPassword.includes(emailParts[0])) {
      return true
    }
  }

  if (name) {
    const nameParts = name.toLowerCase().split(/\s+/)
    for (const part of nameParts) {
      if (part.length > 2 && lowerPassword.includes(part)) {
        return true
      }
    }
  }

  return false
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "!@#$%^&*()_+-="
  const allChars = uppercase + lowercase + numbers + special

  // Ensure at least one of each required type
  let password = ""
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}
