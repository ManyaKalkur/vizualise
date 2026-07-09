import React, { useEffect, useState } from 'react'
import KnapsackSidebar from '../components/KnapsackSidebar.jsx'
import KnapsackOverview from '../components/KnapsackOverview.jsx'
import KnapsackResultPanel from '../components/KnapsackResultPanel.jsx'
import { useKnapsackRun } from '../api/knapsackWebsocket.js'

const API_BASE='https://vizualise.onrender.com'
const MAX_CAPACITY= 50

export default function KnapsackApp({onBack}) {
  const [presets, setPresets]= useState([])
  const [preset, setPreset]= useState('')
  const [items, setItems]= useState([])
  const [selectedItemIds, setSelectedItemIds]= useState([])
  const [capacity, setCapacity]= useState(15)
  const [panelAlgos, setPanelAlgos]= useState(['zero_one_dp'])

  const { results, running, runAll, reset }=useKnapsackRun()
  const hasResults= Object.keys(results).length>0

  useEffect(()=> {
    fetch(`${API_BASE}/api/knapsack/presets`).then((r)=> r.json()).then((data)=> {
      setPresets(data)
      if (data.length) setPreset(data[0])
    })
  }, [])
  useEffect(()=> {
    if (!preset) return
    fetch(`${API_BASE}/api/knapsack/items/${preset}`)
      .then((r)=> r.json())
      .then((data)=> {
        setItems(data)
        setSelectedItemIds(data.map((it)=> it.id))
      })
  }, [preset])
  const toggleItem= (id)=> {
    setSelectedItemIds((prev)=> (prev.includes(id)? prev.filter((x)=>x!== id):[...prev, id]))
  }
  const setPanelAlgo= (i, algo)=> {
    setPanelAlgos((prev)=> {
      const next= [...prev]
      next[i]= algo
      return next
    })
  }
  const addComparePanel= ()=> setPanelAlgos((prev)=> (prev.length<4? [...prev,'fractional_knapsack']:prev))
  const removeLastPanel= ()=> setPanelAlgos((prev)=> (prev.length>1? prev.slice(0,-1):prev))
  const selectedItems= items.filter((it)=> selectedItemIds.includes(it.id))
  const handleRun= ()=> {
    if (selectedItemIds.length<2) return
    const requests= panelAlgos.map((algo, i)=> ({
      run_id:`panel-${i+1}`,
      algo,
      item_ids: selectedItemIds,
      capacity,
      items: selectedItems,
    }))
    runAll(requests)
  }
  const gridCols= panelAlgos.length=== 1?1:panelAlgos.length ===2?2:panelAlgos.length===3?3:2
  return (
    <div className="layout">
      {onBack && (
        <button
          className="secondary"
          onClick={onBack}
          style={{
            position:'fixed',
            top: 10,
            right: 10,
            zIndex: 500
          }}
        >
          All visualizers
        </button>
      )}
      <KnapsackSidebar
        presets={presets} preset={preset} setPreset={setPreset}
        items={items} selectedItemIds={selectedItemIds} toggleItem={toggleItem}
        capacity={capacity} setCapacity={setCapacity} maxCapacity={MAX_CAPACITY}
        panelAlgos={panelAlgos} setPanelAlgo={setPanelAlgo}
        addComparePanel={addComparePanel} removeLastPanel={removeLastPanel}
        running={running} onRun={handleRun}
      />
      <div className="main-area">
        {!hasResults ? (
          <KnapsackOverview items={selectedItems}/>
        ):(
          <div className="results-grid" style={{
            display:'grid',
            gridTemplateColumns:`repeat(${gridCols}, 1fr)`,
            gap: 12
            }}>
            {panelAlgos.map((algo, i)=> {
              const runId= `panel-${i+1}`
              return (
                <KnapsackResultPanel
                  key={runId}
                  algo={algo}
                  items={selectedItems}
                  capacity={capacity}
                  result={results[runId]}
                />
              )
            })}
          </div>
        )}
        {hasResults && (
          <div className="back-button-row">
            <button className="secondary" onClick={reset} disabled={running}>
              Back to item selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}