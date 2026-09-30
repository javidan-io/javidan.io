export const site = {
  name: "Javidan",
  tagline: "Programmer and filmmaker.",
  url: "https://javidan.io",
} as const;

export type NavItem = {
  href: string;
  label: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Work" },
  { href: "/filming", label: "Filming" },
  { href: "/about", label: "About me" },
];
