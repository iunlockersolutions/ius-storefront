export const supportContact = {
  email: "support@evolux.lk",
  phone: "+94 77 767 5577",
  phoneHref: "tel:+94777675577",
  whatsappNumber: "94777675577",
  address: "EvoluX, Matara, Sri Lanka",
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
