import type { ContactLink, NavEntry, NavItem } from "@/lib/types";

export const SITE = {
  name: "JAC El Castillo",
  fullName: "Junta de Acción Comunal Ciudad Campestre El Castillo",
  org: "Junta de Acción Comunal",
  place: "Ciudad Campestre",
  locality: "El Castillo",
  tagline: "Comunidad construyendo Comunidad",
  description:
    "La Junta de Acción Comunal de la Ciudad Campestre El Castillo, en Jamundí, trabaja por la seguridad, los servicios públicos y la vida en comunidad.",
  contact: {
    phone: "+57 315 7531859",
    whatsapp: "573157531859",
    email: "jacelcastillo@gmail.com",
    hours: "Lunes a sábado, 9:00 a. m. a 7:00 p. m.",
  },
} as const;

export const CONTACT_LINKS: ContactLink[] = [
  {
    icon: "mail",
    label: "Correo",
    value: SITE.contact.email,
    href: `mailto:${SITE.contact.email}`,
  },
  {
    icon: "phone",
    label: "Teléfono",
    value: SITE.contact.phone,
    href: `tel:+${SITE.contact.phone.replace(/\D/g, "")}`,
  },
  {
    icon: "whatsapp",
    label: "WhatsApp",
    value: SITE.contact.phone,
    href: `https://wa.me/${SITE.contact.whatsapp}`,
    external: true,
  },
  { icon: "clock", label: "Horario", value: SITE.contact.hours },
];

export const NAV: NavEntry[] = [
  { label: "Inicio", href: "/" },
  {
    label: "La Junta",
    items: [
      { label: "Quiénes somos", href: "/nosotros/" },
      { label: "Dignatarios", href: "/historia/2026-2030/" },
      { label: "Nuestra historia", href: "/historia/" },
      { label: "Comisiones de trabajo", href: "/comisiones/" },
    ],
  },
  { label: "Proyectos", href: "/proyectos/" },
  { label: "Noticias", href: "/noticias/" },
  { label: "Transparencia", href: "/transparencia/" },
  { label: "Contacto", href: "/contacto/" },
];

export const NAV_LINKS: NavItem[] = NAV.flatMap((entry) =>
  "items" in entry ? entry.items : [entry],
);
