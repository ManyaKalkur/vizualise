import React, {useMemo} from 'react'
import {MapContainer,TileLayer,Marker,Polyline,CircleMarker,Tooltip } from 'react-leaflet'

const ALGO_COLORS= {
  brute_force:'#8338ec',
  branch_and_bound:'#ff006e',
}

export default function AlgorithmPanel({algo,cities,cityLookup,result}) {
  const color= ALGO_COLORS[algo]||'#333'
  const center= useMemo(()=> {
    if (!cities.length) return [22.5,80]
    const avgLat= cities.reduce((s,c)=> s+c.lat,0)/cities.length
    const avgLon= cities.reduce((s,c)=> s+c.lon,0)/cities.length
    return [avgLat,avgLon]
  }, [cities])

  const routeLatLngs= useMemo(()=> {
    if (!result?.tour?.length) return []
    const pts= result.tour.map((id)=> {
      const c= cityLookup[id]
      return [c.lat,c.lon]
    })
    if (result.status=== 'done'||result.status=== 'finished') {
      pts.push(pts[0])
    }
    return pts
  }, [result,cityLookup])

  return (
    <div style={{
      border:'1px solid #ddd',
      borderRadius:8,
      overflow:'hidden'
      }}>
      <div style={{
        padding:'6px 10px',
        background: '#f5f5f5',
        fontSize:13,
        display:'flex',
        justifyContent:'space-between'
        }}>
        <strong style={{color}}>{algo.replace(/_/g, ' ')}</strong>
        <span>
          {result?.distance != null? `${result.distance.toFixed(1)} km`:'—'}
          {'  |  '}
          {result?.elapsedMs != null? `${result.elapsedMs.toFixed(0)} ms`:'0 ms'}
          {'  |  '}
          {result?.status||'idle'}
        </span>
      </div>
      <MapContainer center={center} zoom={5} style={{
        height: 320,
        width: '100%'
        }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {cities.map((c)=> (
          <CircleMarker key={c.id} center={[c.lat,c.lon]} radius={4} pathOptions={{ color:'#999' }}>
            <Tooltip>{c.name}</Tooltip>
          </CircleMarker>
        ))}
        {routeLatLngs.length>1 && (
          <Polyline positions={routeLatLngs} pathOptions={{color,weight:3}}/>
        )}
      </MapContainer>
      {result?.possibleTours != null && (
        <div style={{
          padding:'4px 10px',
          fontSize: 11,
          color: '#666'
          }}>
          Possible tours for {cities.length} cities: {result.possibleTours.toLocaleString()}
        </div>
      )}
    </div>
  )
}