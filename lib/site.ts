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
  { href: "/about", label: "About me" },
];

export type WorkTabValue = "all" | "web" | "filming";

export type WorkTab = {
  value: WorkTabValue;
  label: string;
  href: string;
};

export const workTabs: WorkTab[] = [
  { value: "all", label: "All", href: "/" },
  { value: "web", label: "Web", href: "/?tab=web" },
  { value: "filming", label: "Filming", href: "/?tab=filming" },
];

export const defaultWorkTab: WorkTabValue = "all";

/** Narrows an untrusted `?tab=` value to a known tab, falling back to "All". */
export function resolveWorkTab(value: string | string[] | undefined) {
  const tab = workTabs.find((item) => item.value === value);
  return tab ? tab.value : defaultWorkTab;
}

/** Display label for a work category, kept in step with the tab labels. */
export function workCategoryLabel(category: Exclude<WorkTabValue, "all">) {
  return workTabs.find((tab) => tab.value === category)?.label ?? category;
}
