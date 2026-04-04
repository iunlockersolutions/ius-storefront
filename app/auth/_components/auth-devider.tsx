function AuthDivider({ text = "Or continue with" }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="border-border w-full border-t" />
      </div>
      <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-[0.24em]">
        <span className="bg-background text-muted-foreground px-3">{text}</span>
      </div>
    </div>
  )
}

export default AuthDivider
