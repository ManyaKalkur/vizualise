import React from 'react'

const ALGO_OPTIONS= ['fractional_knapsack','zero_one_dp','brute_force','branch_and_bound']
const ALGO_CAPS= {brute_force:20,branch_and_bound:30}
const MAX_PANELS= 4

export default function KnapsackSidebar({
  presets,
  preset,
  setPreset,
  items,
  selectedItemIds,
  toggleItem,
  capacity,
  setCapacity,
  maxCapacity,
  panelAlgos,
  setPanelAlgo,
  addComparePanel,
  removeLastPanel,
  running,
  onRun,
}){
  const selectedItems= items.filter((it)=> selectedItemIds.includes(it.id))
  const totalWeight= selectedItems.reduce((s, it)=> s+it.weight,0)
  const possibleSubsets= selectedItemIds.length?2**selectedItemIds.length:0
  const canAddPanel= panelAlgos.length<MAX_PANELS
  return (
    <div className="sidebar">
      <h1>Knapsack Visualizer</h1>
      <div className="tagline">Watch 0/1 Knapsack algorithms pack the bag, live.</div>
      <div className="section">
        <div className="section-label">1. Item Set</div>
        <select value={preset} onChange={(e)=> setPreset(e.target.value)} style={{width:'100%'}}>
          {presets.map((p)=> <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="section">
        <div className="section-label">2. Items ({selectedItemIds.length}/{items.length})</div>
        <div className="city-list">
          {items.map((it)=> (
            <label key={it.id}>
              <input type="checkbox" checked={selectedItemIds.includes(it.id)} onChange={()=> toggleItem(it.id)}/>
              {' '}{it.name} <span style={{color:'#5c7a8a'}}>({it.weight}kg, {it.value}pt)</span>
            </label>
          ))}
        </div>
        {selectedItemIds.length<2 && <div className="possible-tours">Select at least 2 items.</div>}
      </div>
      <div className="section">
        <div className="section-label">3. Bag Capacity ({capacity} kg)</div>
        <input
          type="range" min="1" max={maxCapacity} value={capacity}
          onChange={(e)=> setCapacity(Number(e.target.value))}
          style={{width:'100%'}}
        />
        <div className="possible-tours">
          Selected items total weight: <b>{totalWeight} kg</b><br/>
          Possible subsets: <b>{possibleSubsets.toLocaleString()}</b>
        </div>
      </div>
      <div className="section">
        <div className="section-label">4. Algorithm</div>
        {panelAlgos.map((algo, i)=> {
          const cap= ALGO_CAPS[algo]
          const overCap= cap && selectedItemIds.length>cap
          return (
            <div key={i}>
              <div className="panel-config">
                <span style={{fontSize:12}}>{i ===0?'Main':`Compare ${i}`}</span>
                <select value={algo} onChange={(e)=> setPanelAlgo(i, e.target.value)}>
                  {ALGO_OPTIONS.map((a)=> <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {overCap && (
                <div className="max-reached" style={{marginTop:-4}}>
                  {algo.replace(/_/g, ' ')} caps at {cap} items: you have {selectedItemIds.length} selected, this panel will give error.
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
          <div className="max-reached">Max reached: 4 panels max.</div>
        )}
        {panelAlgos.length>1 && (
          <button className="secondary" onClick={removeLastPanel} style={{width:'100%',marginTop:6}}>
            − Remove last comparison
          </button>
        )}
      </div>
      <button onClick={onRun} disabled={running || selectedItemIds.length<2} style={{width:'100%',padding: 10,fontSize:14}}>
        {running? 'Running…':'Run'}
      </button>
    </div>
  )
}