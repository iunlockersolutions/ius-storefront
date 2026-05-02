export const supportContact = {
  email: "support@evolux.example",
  phone: "+94 77 123 4567",
  phoneHref: "tel:+94771234567",
  whatsappNumber: "94771234567",
  address: "EvoluX Store, Main Street, Matara, Sri Lanka",
}

export function buildWhatsAppHref(message: string) {
  return `https://wa.me/${supportContact.whatsappNumber}?text=${encodeURIComponent(
    message,
  )}`
}

export const deliveryDetails = {
  estimate: "3 to 5 working days",
  coverage: "Islandwide delivery across Sri Lanka",
}
