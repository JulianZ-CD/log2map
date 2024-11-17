'use client'

import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

export default function MapWrapper() {
  return <LocationMap />
}