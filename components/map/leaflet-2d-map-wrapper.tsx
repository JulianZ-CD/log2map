'use client'

import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('./leaflet-2d-map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

export default function MapWrapper() {
  return <LocationMap />
}