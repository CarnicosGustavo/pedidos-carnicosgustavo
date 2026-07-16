const env = import.meta.env as unknown as Record<string, string | undefined>

export const BUSINESS = {
  name: 'Centro de Distribucion de Carnicos Gustavo',
  shortName: 'Carnicos Gustavo',
  tagline: 'Centro de Distribucion de Carnicos Gustavo',
  locationLabel: env.VITE_LOCATION_LABEL?.trim() || 'Naucalpan, Estado de Mexico',
}

export const CONTACT = {
  whatsappPhoneE164: env.VITE_WHATSAPP_PHONE?.trim() || '525543287020',
}
