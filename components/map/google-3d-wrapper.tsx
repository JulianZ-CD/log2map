'use client'

import dynamic from 'next/dynamic'

const Google3DMap = dynamic(() => import('./google-3d-map'), {
  ssr: false,
  loading: () => <p>Loading 3D map...</p>
})

export default function Google3DWrapper() {
  return <Google3DMap />
} 