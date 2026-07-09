import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/TSPSidebar.jsx'
import OverviewMap from '../components/OverviewMap.jsx'
import ResultPanel from '../components/ResultPanel.jsx'
import {useTSPRun} from '../api/tspWebsocket.js'
import {possibleTours} from '../utils.js'

const API_BASE = 'https://vizualise.onrender.com/'

export default function TSPApp({ onBack }) {
  const [scope,setScope]= useState('national')
  const [states,setStates]= useState([])
  const [selectedState,setSelectedState]= useState('')
  const [cities,setCities]= useState([])
  const [selectedCityIds,setSelectedCityIds]= useState([])
  const [startId,setStartId]= useState('')
  const [panelAlgos,setPanelAlgos]= useState(['nearest_neighbor'])
  const {results,running,runAll,reset}= useTSPRun()
  const hasResults= Object.keys(results).length>0
  useEffect(()=> {
    fetch(`${API_BASE}/api/cities/states`).then((r)=> r.json()).then(setStates)
  },[])
  useEffect(()=> {
    if (scope=== 'state' && !selectedState) {
      setCities([])
      setSelectedCityIds([])
      setStartId('')
      return
    }
    const url=
      scope=== 'national'
        ? `${API_BASE}/api/cities/national`
        : `${API_BASE}/api/cities/state/${encodeURIComponent(selectedState)}`
    fetch(url)
      .then((r)=> r.json())
      .then((data)=> {
        setCities(data)
        setSelectedCityIds(data.map((c)=> c.id))
        setStartId(data[0]?.id || '')
      })
  }, [scope, selectedState])

  const cityLookup= useMemo(()=> {
    const m= {}
    cities.forEach((c)=> (m[c.id]= c))
    return m
  }, [cities])

  const toggleCity= (id)=> {
    setSelectedCityIds((prev)=> (prev.includes(id)? prev.filter((x)=> x !== id): [...prev, id]))
  }
  useEffect(()=> {
    if (selectedCityIds.length && !selectedCityIds.includes(startId)) {
      setStartId(selectedCityIds[0])
    }
  }, [selectedCityIds])

  const setPanelAlgo= (i, algo)=> {
    setPanelAlgos((prev)=> {
      const next= [...prev]
      next[i]= algo
      return next
    })
  }
  const addComparePanel= ()=> setPanelAlgos((prev)=> (prev.length<4?[...prev,'two_opt_inversion']:prev))
  const removeLastPanel= ()=> setPanelAlgos((prev)=> (prev.length>1?prev.slice(0,-1):prev))
  const selectedCities= cities.filter((c)=> selectedCityIds.includes(c.id))
  const handleRun= ()=> {
    if (selectedCityIds.length<3 || !startId) return
    const tours= possibleTours(selectedCityIds.length)
    const requests= panelAlgos.map((algo,i)=> ({
      run_id:`panel-${i+1}`,
      algo,
      city_ids:selectedCityIds,
      start_id:startId,
    }))
    runAll(requests)
  }

  const gridCols= panelAlgos.length=== 1?1:panelAlgos.length=== 2?2:panelAlgos.length=== 3?3:2

  return (
    <div className="layout">
      {onBack && (
        <button
          className="secondary"
          onClick={onBack}
          style={{ position:'fixed',top:10,right:10,zIndex:500}}
        >
          All visualizers
        </button>
      )}
      <Sidebar
        scope={scope} setScope={setScope}
        states={states} selectedState={selectedState} setSelectedState={setSelectedState}
        cities={cities} selectedCityIds={selectedCityIds} toggleCity={toggleCity}
        startId={startId} setStartId={setStartId}
        panelAlgos={panelAlgos} setPanelAlgo={setPanelAlgo}
        addComparePanel={addComparePanel} removeLastPanel={removeLastPanel}
        running={running} onRun={handleRun}
      />

      <div className="main-area">
        {!hasResults? (
          <OverviewMap cities={selectedCities}/>
        ) : (
          <div className="results-grid" style={{ gridTemplateColumns:`repeat(${gridCols}, 1fr)`}}>
            {panelAlgos.map((algo,i)=> {
              const runId= `panel-${i+1}`
              return (
                <ResultPanel
                  key={runId}
                  algo={algo}
                  cities={selectedCities}
                  cityLookup={cityLookup}
                  result={results[runId]}
                />
              )
            })}
          </div>
        )}
        {hasResults && (
          <div className="back-button-row">
            <button className="secondary" onClick={reset} disabled={running}>
              Back to city selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}