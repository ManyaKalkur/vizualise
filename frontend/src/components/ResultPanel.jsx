import React, {useMemo,useState} from 'react'
import {MapContainer,TileLayer,Polyline,CircleMarker,Tooltip,useMap} from 'react-leaflet'
import {useEffect} from 'react'
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip as ChartTooltip,ResponsiveContainer} from 'recharts'

function RecenterOnChange({center,zoom}) {
  const map= useMap()
  useEffect(()=> {
    map.setView(center, zoom)
  }, [center[0], center[1], zoom])
  return null
}

const ALGO_COLORS= {
  brute_force: '#8338ec',
  branch_and_bound: '#ff006e',
}
const API_BASE = 'http://localhost:8000'

export default function ResultPanel({ algo,cities,cityLookup,result }) {
  const [view, setView]= useState('map')
  const [xMode, setXMode]= useState('time')
  const [showCode, setShowCode]= useState(false)
  const [code, setCode]= useState('')
  const [codeLoading, setCodeLoading]= useState(false)
  const color= ALGO_COLORS[algo] || '#333'
  const openCode= ()=> {
    setShowCode(true)
    if (!code) {
      setCodeLoading(true)
      fetch(`${API_BASE}/api/algorithm-code/${algo}`)
        .then((r)=> r.json())
        .then((data)=> setCode(data.source || data.detail || 'No source found.'))
        .catch(()=> setCode('Could not load source Ensure that the backend running?'))
        .finally(()=> setCodeLoading(false))
    }
  }
  const center = useMemo(() => {
    if (!cities.length) return [22.5, 80]
    const avgLat= cities.reduce((s, c)=> s+c.lat,0)/cities.length
    const avgLon= cities.reduce((s, c)=> s+c.lon,0)/cities.length
    return [avgLat, avgLon]
  }, [cities])

  const routeLatLngs= useMemo(()=> {
    if (!result?.tour?.length) return []
    const pts= result.tour.map((id) => {
      const c= cityLookup[id]
      return [c.lat, c.lon]
    })
    if (result.status==='done' || result.status==='finished')
      pts.push(pts[0])
    return pts
  }, [result, cityLookup])
  const chartData= (result?.history || []).map((p)=> ({
    x: xMode=== 'time'? Math.round(p.t):p.step,
    distance: p.distance,
  }))
  return (
    <div className="result-panel">
      <div className="result-header">
        <span className="algo-name" style={{color}}>{algo.replace(/_/g, ' ')}</span>
        <span>
          <span className="stat-chip">best:{result?.distance != null ? `${result.distance.toFixed(1)} km`:'-'}</span>
          <span className="stat-chip">time:{result?.elapsedMs != null ? `${result.elapsedMs.toFixed(0)} ms`:'0 ms'}</span>
          <span className="stat-chip">{result?.status || 'idle'}</span>
        </span>
        <span className="view-toggle">
          <button className={view=== 'map'?'':'secondary'} onClick={()=> setView('map')}>Map</button>{' '}
          <button className={view=== 'graph'?'':'secondary'} onClick={()=>setView('graph')}>Graph</button>{' '}
          <button className="secondary" onClick={openCode}>{'</>'} Code</button>
        </span>
      </div>

      {result?.status=== 'error' && (
        <div style={{padding:'4px 12px', fontSize:11, color:'#c0392b'}}>
          {result.errorMessage || 'Connection error. Check the backend is running on port 8000.'}
        </div>
      )}
      {result?.possibleTours != null && (
        <div style={{ padding:'4px 12px', fontSize:11, color:'#5c7a8a' }}>
          Possible tours for {cities.length} cities: {result.possibleTours.toLocaleString()}
        </div>
      )}
      {showCode && (
        <div
          style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,0.5)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex: 1000,
          }}
          onClick={()=> setShowCode(false)}
        >
          <div
            style={{
              background:'white',
              borderRadius:8,
              padding:16,
              maxWidth:'80vw',
              maxHeight:'80vh',
              overflow:'auto',
              boxShadow:'0 4px 24px rgba(0,0,0,0.3)',
            }}
            onClick={(e)=> e.stopPropagation()}
          >
            <div style={{ 
              display:'flex',
              justifyContent:'space-between',
              marginBottom: 8
              }}>
              <strong>{algo.replace(/_/g, ' ')} :source</strong>
              <button className="secondary" onClick={()=> setShowCode(false)}>✕ Close</button>
            </div>
            <pre style={{ 
              fontSize:12,
              background:'#f4fbff',
              padding:12,
              borderRadius:6,
              overflow:'auto'}}>
              <code>{codeLoading?'Loading…':code}</code>
            </pre>
          </div>
        </div>
      )}
      {view === 'map'?(
        <MapContainer center={center} zoom={5} style={{height:300, width:'100%'}}>
          <RecenterOnChange center={center} zoom={5}/>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {cities.map((c)=> (
            <CircleMarker key={c.id} center={[c.lat, c.lon]} radius={4} pathOptions={{color: '#999'}}>
              <Tooltip>{c.name}</Tooltip>
            </CircleMarker>
          ))}
          {routeLatLngs.length>1 && <Polyline positions={routeLatLngs} pathOptions={{color,weight:3}}/>}
        </MapContainer>
      ):(
        <div style={{padding:10}}>
          <div style={{marginBottom:6}}>
            <button className={xMode==='time'?'':'secondary'} 
            onClick={()=> setXMode('time')}>vs Time</button>{' '}
            <button className={xMode==='step'?'':'secondary'} 
            onClick={()=> setXMode('step')}>vs Step</button>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ 
              top:5,
              right:20,
              left:0,
              bottom:0
              }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="x" label={{value: xMode === 'time'?'ms':'step', position:'insideBottom', offset:-5}}/>
              <YAxis label={{ 
                value:'km',
                angle: -90,
                position: 'insideLeft'
                }}/>
              <ChartTooltip/>
              <Line type="monotone" dataKey="distance" stroke={color} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}