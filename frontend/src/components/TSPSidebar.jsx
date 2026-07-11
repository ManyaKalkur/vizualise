import React from 'react'
import {possibleTours} from '../utils.js'

const ALGO_OPTIONS= [
  'nearest_neighbor',
  'random_paths',
  'brute_force',
  'branch_and_bound',
]
const MAX_PANELS= 4
const ALGO_CAPS= {
  brute_force:10,
  branch_and_bound:15,
}

export default function Sidebar({
  scope,
  setScope,
  states,
  selectedState,
  setSelectedState,
  cities,
  selectedCityIds,
  toggleCity,
  startId,
  setStartId,
  panelAlgos,
  setPanelAlgo,
  addComparePanel,
  removeLastPanel,
  running,
  onRun,
}) {
  const selectedCities= cities.filter((c)=> selectedCityIds.includes(c.id))
  const tours= selectedCityIds.length>=3?possibleTours(selectedCityIds.length):null
  const canAddPanel= panelAlgos.length<MAX_PANELS

  return (
    <div className="sidebar">
      <h1>India TSP Visualizer</h1>
      <div className="tagline">Watch different TSP algorithms race across the map, live.</div>
      <div className="section">
        <div className="section-label">1. Scope</div>
        <div className="radio-row">
          <label><input type="radio" checked={scope=== 'national'} onChange={()=> setScope('national')}/> National</label>
          <label><input type="radio" checked={scope=== 'state'} onChange={()=> setScope('state')}/> State</label>
        </div>
        {scope=== 'state' && (
          <select value={selectedState} onChange={(e)=> setSelectedState(e.target.value)} style={{width:'100%'}}>
            <option value="">Select state…</option>
            {states.map((s)=> <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      <div className="section">
        <div className="section-label">2. Cities ({selectedCityIds.length}/{cities.length})</div>
        <div style={{display:'flex',gap:6,marginBottom:6}}>
          <button className="secondary" onClick={selectAllCities} style={{flex:1}}>Select all</button>
          <button className="secondary" onClick={deselectAllCities} style={{flex:1}}>Deselect all</button>
        </div>
        <div className="city-list">
          {cities.length === 0 && <div style={{fontSize: 12,color: '#5c7a8a'}}>No cities loaded yet.</div>}
          {cities.map((c)=> (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={selectedCityIds.includes(c.id)}
                onChange={()=> toggleCity(c.id)}
              /> {c.name}
            </label>
          ))}
        </div>
        {tours !== null && (
          <div className="possible-tours">Possible tours: <b>{tours.toLocaleString()}</b></div>
        )}
        {selectedCityIds.length<3 && <div className="possible-tours">Select at least 3 cities.</div>}
      </div>
      <div className="section">
        <div className="section-label">3. Start City</div>
        <select value={startId} onChange={(e)=> setStartId(e.target.value)} style={{width:'100%'}}>
          {selectedCities.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="section">
        <div className="section-label">4. Algorithm</div>
        {panelAlgos.map((algo, i)=> {
          const cap= ALGO_CAPS[algo]
          const overCap= cap && selectedCityIds.length>cap
          return (
            <div key={i}>
              <div className="panel-config">
                <span style={{fontSize:12}}>{i === 0? 'Main':`Compare ${i}`}</span>
                <select value={algo} onChange={(e)=> setPanelAlgo(i, e.target.value)}>
                  {ALGO_OPTIONS.map((a)=><option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {overCap && (
                <div className="max-reached" style={{ marginTop:-4 }}>
                  {algo.replace(/_/g, ' ')} caps at {cap} cities: you have {selectedCityIds.length} selected, this panel will give error.
                </div>
              )}
            </div>
          )
        })}
        {canAddPanel? (
          <button className="secondary" onClick={addComparePanel} style={{width:'100%'}}>
            + Compare another algorithm
          </button>
        ):(
          <div className="max-reached">Max reached: 4 panels max</div>
        )}
        {panelAlgos.length>1 && (
          <button className="secondary" onClick={removeLastPanel} style={{width:'100%', marginTop:6}}>
            − Remove last comparison
          </button>
        )}
      </div>
      <button
        onClick={onRun}
        disabled={running||selectedCityIds.length<3||!startId}
        style={{width:'100%',padding:10,fontSize:14}}
      >
        {running?'Running…':'Run'}
      </button>
    </div>
  )
}