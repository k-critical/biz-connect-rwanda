// Rwanda's five provinces and thirty districts (administrative structure since 2006).
export const provinces = [
  {
    slug: "kigali",
    name: "Kigali City",
    districts: ["Gasabo", "Kicukiro", "Nyarugenge"],
  },
  {
    slug: "northern",
    name: "Northern Province",
    districts: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  },
  {
    slug: "southern",
    name: "Southern Province",
    districts: [
      "Gisagara",
      "Huye",
      "Kamonyi",
      "Muhanga",
      "Nyamagabe",
      "Nyanza",
      "Nyaruguru",
      "Ruhango",
    ],
  },
  {
    slug: "eastern",
    name: "Eastern Province",
    districts: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  },
  {
    slug: "western",
    name: "Western Province",
    districts: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
  },
] as const;

export function districtSlug(name: string): string {
  return name.toLowerCase();
}
