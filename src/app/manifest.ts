import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Remact Panel',
    short_name: 'Remact',
    description: 'Panel de administración de Remact',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#09090b',
    icons: [
      {
        src: '/remact-logo.webp',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
