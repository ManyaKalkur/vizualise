import React from 'react'

const ALGO_OPTIONS= ['greedy_assignment', 'hungarian_algorithm', 'brute_force', 'branch_and_bound']
const ALGO_CAPS= {brute_force: 8,branch_and_bound: 10}
const MAX_PANELS= 4

export default function AssignmentSidebar({
  presets,
  preset,
  setPreset,
  size,
  setSize,
  maxSize,
  panelAlgos,
  setPanelAlgo,
  addComparePanel,
  removeLastPanel,
  running,
  onRun,
}) {
  const possibleAssignments=factorial(size)
  const canAddPanel=panelAlgos.length<MAX_PANELS
  return (
    <div className="sidebar">
      <h1>Assignment Visualizer</h1>
      <div className="tagline">Watch algorithms match workers to jobs, live.</div>
      <div className="section">
        <div className="section-label">1. Scenario</div>
        <select value={preset} onChange={(e)=> setPreset(e.target.value)} style={{width:'100%'}}>
          {presets.map((p)=> <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="section">
        <div className="section-label">2. Number of Workers/Jobs ({size})</div>
        <input
          type="range" min="2" max={maxSize} value={size}
          onChange={(e)=> setSize(Number(e.target.value))}
          style={{width:'100%'}}
        />
        <div className="possible-tours">Possible assignments: <b>{possibleAssignments.toLocaleString()}</b></div>
      </div>

      <div className="section">
        <div className="section-label">3. Algorithm</div>
        {panelAlgos.map((algo, i)=> {
          const cap=ALGO_CAPS[algo]
          const overCap=cap && size>cap
          return (
            <div key={i}>
              <div className="panel-config">
                <span style={{fontSize:12}}>{i===0?'Main':`Compare ${i}`}</span>
                <select value={algo} onChange={(e)=> setPanelAlgo(i, e.target.value)}>
                  {ALGO_OPTIONS.map((a)=> <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {overCap && (
                <div className="max-reached" style={{marginTop:-4}}>
                  {algo.replace(/_/g, ' ')} caps at {cap}: you have {size}, this panel will give error.
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
        {panelAlgos.length > 1 && (
          <button className="secondary" onClick={removeLastPanel} style={{width:'100%',marginTop:6}}>
            - Remove last comparison
          </button>
        )}
      </div>
      <button onClick={onRun} disabled={running} style={{
        width: '100%',
        padding: 10,
        fontSize: 14
        }}>
        {running ? 'Running…':'Run'}
      </button>
    </div>
  )
}

function factorial(n) {
  let r=1
  for (let i=2;i<=n;i++) r*= i
  return r
}