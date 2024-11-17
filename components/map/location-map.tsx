'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'react-leaflet-markercluster/dist/styles.min.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'


const customIcon = new L.Icon({
  iconUrl: '/images/placeholder.png',
  iconSize: [38, 38]
})


const createClusterCustomIcon = function (cluster: L.MarkerCluster) {
  return L.divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(33, 33, true)
  })
}

// markers
const markers = [
  {
    geocode: [48.86, 2.3522],
    popUp: "Hello, I am pop up 1"
  },
  {
    geocode: [48.85, 2.3522],
    popUp: "Hello, I am pop up 2"
  },
  {
    geocode: [48.855, 2.34],
    popUp: "Hello, I am pop up 3"
  }
]

export default function LocationMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
    
    return () => {
      if (mapRef.current) {
        const map = mapRef.current as L.Map;
        map.off();
      }
    }
  }, [])

  return (
    <MapContainer 
      ref={mapRef}
      center={[48.8566, 2.3522]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* @ts-ignore */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
      >
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.geocode as L.LatLngExpression} icon={customIcon}>
            <Popup>{marker.popUp}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}