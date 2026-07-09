import React, { useEffect, useState } from 'react'
import AssignmentSidebar from '../components/AssignmentSidebar.jsx'
import AssignmentOverview from '../components/AssignmentOverview.jsx'
import AssignmentResultPanel from '../components/AssignmentResultPanel.jsx'
import { useAssignmentRun } from '../api/assignmentWebsocket.js'

const API_BASE= 'https://vizualise.onrender.com'
const MAX_SIZE= 8

export default function AssignmentApp({ onBack }) {
  const [presets, setPresets]= useState([])
  const [preset, setPreset]= useState('')
  const [size, setSize]= useState(6)
  const [data, setData]= useState({workers:[], jobs:[], cost_matrix:[]})
  const [panelAlgos, setPanelAlgos]= useState(['hungarian_algorithm'])
  const { results, running, runAll, reset }= useAssignmentRun()
  const hasResults= Object.keys(results).length>0
  useEffect(()=> {
    fetch(`${API_BASE}/api/assignment/presets`).then((r)=> r.json()).then((names)=> {
      setPresets(names)
      if (names.length) setPreset(names[0])
    })
  }, [])
  useEffect(()=> {
    if (!preset) return
    fetch(`${API_BASE}/api/assignment/data/${preset}?size=${size}`)
      .then((r)=> r.json())
      .then(setData)
  }, [preset, size])
  const setPanelAlgo= (i, algo)=> {
    setPanelAlgos((prev)=> {
      const next= [...prev]
      next[i]= algo
      return next
    })
  }
  const addComparePanel= ()=> setPanelAlgos((prev)=> 
    (prev.length<4? [...prev, 'greedy_assignment']:prev))
  const removeLastPanel= ()=> setPanelAlgos((prev)=>
    (prev.length>1?prev.slice(0, -1):prev))
  const handleRun= ()=> {
    if (!data.cost_matrix.length) return
    const requests= panelAlgos.map((algo, i)=> ({
      run_id: `panel-${i+1}`,
      algo,
      cost_matrix: data.cost_matrix,
    }))
    runAll(requests)
  }
  const gridCols= panelAlgos.length=== 1?1: panelAlgos.length=== 2?2:panelAlgos.length === 3?3:2
  return (
    <div className="layout">
      {onBack && (
        <button className="secondary" onClick={onBack} style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 500
          }}>
          All visualizers
        </button>
      )}
      <AssignmentSidebar
        presets={presets} preset={preset} setPreset={setPreset}
        size={size} setSize={setSize} maxSize={MAX_SIZE}
        panelAlgos={panelAlgos} setPanelAlgo={setPanelAlgo}
        addComparePanel={addComparePanel} removeLastPanel={removeLastPanel}
        running={running} onRun={handleRun}
      />
      <div className="main-area">
        {!hasResults ? (
          <AssignmentOverview workers={data.workers} jobs={data.jobs} costMatrix={data.cost_matrix}/>
        ):(
          <div className="results-grid" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 12
            }}>
            {panelAlgos.map((algo, i)=> {
              const runId= `panel-${i+1}`
              return (
                <AssignmentResultPanel
                  key={runId}
                  algo={algo}
                  workers={data.workers}
                  jobs={data.jobs}
                  costMatrix={data.cost_matrix}
                  result={results[runId]}
                />
              )
            })}
          </div>
        )}
        {hasResults && (
          <div className="back-button-row">
            <button className="secondary" onClick={reset} disabled={running}>
              Back to setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}