import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import { WS_URL } from '../api/tspWebsocket.js'

const COLORS= {
  explore:'#457b9d',
  prune:'#c0392b',
  leafBest:'#2a9d8f',
  leafWorse:'#999',
  chosen:'#2a9d8f',
  rejected:'#c0392b',
}

const TREE_MODE_ALGOS= new Set(['brute_force','branch_and_bound'])
const CANDIDATE_MODE_ALGOS= new Set(['nearest_neighbor'])

export default function TraceModal({
  algo,
  cities,
  cityLookup,
  startId,
  onClose,
}) {
  const [events,setEvents]= useState([])
  const [loading,setLoading]= useState(true)
  const [error,setError]= useState(null)
  const [index,setIndex]= useState(0)
  const [playing,setPlaying]= useState(false)
  const [speedMs,setSpeedMs]= useState(500)
  const wsRef= useRef(null)

  const mode= TREE_MODE_ALGOS.has(algo)? 'tree':CANDIDATE_MODE_ALGOS.has(algo)? 'candidates':null

  useEffect(()=> {
    const cityIds= cities.map((c)=> c.id)
    const ws= new WebSocket(WS_URL)
    wsRef.current= ws
    const collected= []

    ws.onopen= ()=> {
      ws.send(JSON.stringify({
        requests:[{ run_id:'trace', algo, city_ids:cityIds, start_id:startId, trace:true }],
      }))
    }
    ws.onmessage= (event)=> {
      const msg= JSON.parse(event.data)
      if (msg.type=== 'all_done') {
        setEvents(collected)
        setLoading(false)
        ws.close()
        return
      }
      if (msg.type=== 'error' || (msg.type=== 'done' && msg.error)) {
        setError(msg.message || msg.error)
        setLoading(false)
        return
      }
      if (['explore','prune','leaf','candidates'].includes(msg.type)) {
        collected.push(msg)
      }
    }
    ws.onerror= ()=> { setError('Could not reach backend at '+WS_URL); setLoading(false) }

    return ()=> ws.close()
  }, [algo, startId])

  useEffect(()=> {
    if (!playing || index>=events.length-1) { setPlaying(false); return }
    const t= setTimeout(()=> setIndex((i)=> Math.min(i+1, events.length-1)), speedMs)
    return ()=> clearTimeout(t)
  }, [playing, index, events, speedMs])

  const current= events[index]

  const routeLatLngs= useMemo(()=> {
    if (!current?.tour) return []
    return current.tour.map((id)=> {
      const c= cityLookup[id]
      return c? [c.lat, c.lon]:null
    }).filter(Boolean)
  }, [current, cityLookup])

  const routeColor= useMemo(()=> {
    if (!current) return COLORS.explore
    if (current.type=== 'prune') return COLORS.prune
    if (current.type=== 'leaf') return current.is_best? COLORS.leafBest:COLORS.leafWorse
    if (current.type=== 'candidates') return COLORS.chosen
    return COLORS.explore
  }, [current])

  const center= useMemo(()=> {
    if (!cities.length) return [22.5, 80]
    const avgLat= cities.reduce((s, c)=> s+c.lat, 0)/cities.length
    const avgLon= cities.reduce((s, c)=> s+c.lon, 0)/cities.length
    return [avgLat, avgLon]
  }, [cities])

  const treeLines= useMemo(()=> {
    if (mode !== 'tree') return []
    return events.slice(0, index+1).map((e, i)=> {
      const depth= (e.tour?.length || 1)-1
      const label= e.tour?.map((id)=> cityLookup[id]?.name || id).join('->')
      let tag= ''
      if (e.type=== 'prune') tag= `  pruned${e.bound!= null? ` bound=${e.bound}`:''}`
      if (e.type=== 'leaf') tag= e.is_best? '  new best!':'  (worse, discarded)'
      return { depth, label, tag, type:e.type, isBest:e.is_best, isCurrent:i=== index }
    })
  }, [events, index, mode, cityLookup])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:10, width:'92vw', maxWidth:1100, height:'85vh', display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ padding:'10px 16px', background:'#eaf6ff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong style={{ color:'#2f7ea8' }}>{algo.replace(/_/g, ' ')}: trace playback</strong>
          <button className="secondary" onClick={onClose}>X Close</button>
        </div>

        {loading && <div style={{ padding:24 }}>Loading full trace… (running the algorithm once to record every step)</div>}
        {error && <div style={{ padding:24, color:'#c0392b' }}>{error}</div>}

        {!loading && !error && (
          <>
            <div style={{ padding:'8px 16px', fontSize:11, display:'flex', gap:14, borderBottom:'1px solid #cfe9f7' }}>
              <LegendDot color={COLORS.explore} label="Exploring"/>
              <LegendDot color={COLORS.prune} label="Pruned/Rejected"/>
              <LegendDot color={COLORS.leafBest} label="New best found"/>
              <LegendDot color={COLORS.leafWorse} label="Complete but worse"/>
            </div>

            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <MapContainer center={center} zoom={5} style={{ height:'100%', width:'100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  {cities.map((c)=> (
                    <CircleMarker key={c.id} center={[c.lat, c.lon]} radius={4} pathOptions={{ color:'#999' }}>
                      <Tooltip>{c.name}</Tooltip>
                    </CircleMarker>
                  ))}
                  {routeLatLngs.length>1 && (
                    <Polyline
                      positions={routeLatLngs}
                      pathOptions={{ color:routeColor, weight:3, dashArray:current?.type=== 'prune'? '6 6':undefined }}
                    />
                  )}
                </MapContainer>
              </div>

              <div style={{ width:380, borderLeft:'1px solid #cfe9f7', overflowY:'auto', padding:10, fontSize:12, fontFamily:'monospace' }}>
                {mode=== 'tree' && treeLines.map((l, i)=> (
                  <div
                    key={i}
                    style={{
                      paddingLeft:l.depth*14,
                      color:l.type=== 'prune'? COLORS.prune:l.isBest? COLORS.leafBest:l.type=== 'leaf'? COLORS.leafWorse:'#1f3b4d',
                      fontWeight:l.isCurrent? 700:400,
                      background:l.isCurrent? '#eaf6ff':'transparent',
                    }}
                  >
                    {l.label}{l.tag}
                  </div>
                ))}

                {mode=== 'candidates' && current?.type=== 'candidates' && (
                  <div>
                    <div style={{ marginBottom:6, fontWeight:700 }}>Step {index+1}{current.note? ` - ${current.note}`:''}</div>
                    {current.candidates
                      .slice()
                      .sort((a, b)=> (a.distance ?? 0)-(b.distance ?? 0))
                      .map((c, i)=> {
                        const isChosen= c.city=== current.chosen
                        return (
                          <div key={i} style={{ color:isChosen? COLORS.chosen:COLORS.rejected }}>
                            {isChosen? 'Y':'N'}
                            {cityLookup[c.city]?.name || c.city}
                            {c.distance!= null? ` - ${c.distance} km`:''}
                            {isChosen? '  (chosen)':''}
                          </div>
                        )
                      })}
                  </div>
                )}
                {mode=== 'candidates' && current?.type !== 'candidates' && (
                  <div style={{ color:'#5c7a8a' }}>(tour update step: no candidate list at this index)</div>
                )}
              </div>
            </div>

            <div style={{ padding:12, borderTop:'1px solid #cfe9f7', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <button className="secondary" onClick={()=> { setPlaying(false); setIndex((i)=> Math.max(0, i-1)) }}>Prev</button>
              <button onClick={()=> setPlaying((p)=> !p)}>{playing? '|| Pause':' O Play'}</button>
              <button className="secondary" onClick={()=> { setPlaying(false); setIndex((i)=> Math.min(events.length-1, i+1)) }}>Next</button>
              <span style={{ fontSize:12 }}>Event {index+1}/{events.length}</span>
              <label style={{ fontSize:12, marginLeft:'auto' }}>
                Speed:{' '}
                <select value={speedMs} onChange={(e)=> setSpeedMs(Number(e.target.value))}>
                  <option value={1500}>Slow</option>
                  <option value={700}>Normal</option>
                  <option value={300}>Fast</option>
                  <option value={100}>Very fast</option>
                </select>
              </label>
              <input
                type="range" min={0} max={Math.max(0, events.length-1)} value={index}
                onChange={(e)=> { setPlaying(false); setIndex(Number(e.target.value)) }}
                style={{ width:'100%' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
function LegendDot({ color, label }) {
  return (
    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ width:10, height:10, borderRadius:5, background:color, display:'inline-block' }}/>
      {label}
    </span>
  )
}