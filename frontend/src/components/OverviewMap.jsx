import React, { useEffect, useMemo } from 'react'
import {MapContainer,TileLayer,CircleMarker,Tooltip,useMap,ZoomControl} from 'react-leaflet'

function RecenterOnChange({center,zoom}) {
  const map= useMap()
  useEffect(()=> {
    map.setView(center, zoom)
  }, [center[0], center[1], zoom])
  return null
}

export default function OverviewMap({cities}) {
  const center= useMemo(()=> {
    if (!cities.length) return [22.5,80]
    const avgLat= cities.reduce((s,c)=> s+c.lat,0)/cities.length
    const avgLon= cities.reduce((s,c)=> s+c.lon,0)/cities.length
    return [avgLat, avgLon]
  }, [cities])

  return (
    <div className="overview-map">
      <MapContainer center={center} zoom={cities.length?5:4} style={{ height:'100%',width:'100%'}}zoomControl={false}>
        <ZoomControl position="topright"/>
        <RecenterOnChange center={center} zoom={cities.length?5:4}/>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {cities.map((c)=> (
          <CircleMarker key={c.id} center={[c.lat,c.lon]} radius={5} pathOptions={{ 
            color:'#2f7ea8',
            fillColor:'#4fa8d8',
            fillOpacity:0.8
            }}>
            <Tooltip>{c.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}