export const contactInfo = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "reddunesolutions@gmail.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+351 926 632 851",
  city: process.env.NEXT_PUBLIC_CONTACT_CITY ?? "Fuseta",
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/reddune_solutions/",
} as const;
