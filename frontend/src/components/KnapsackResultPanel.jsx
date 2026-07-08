import React, {useMemo,useState} from 'react'
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip as ChartTooltip,ResponsiveContainer } from 'recharts'

const API_BASE= 'http://localhost:8000'

const ALGO_COLORS= {
  fractional_knapsack:'#f4a261',
  zero_one_dp:'#2a9d8f',
  brute_force:'#8338ec',
  branch_and_bound:'#ff006e',
}

export default function KnapsackResultPanel({algo, items, capacity, result}) {
  const [view, setView]= useState('items')
  const [xMode, setXMode]= useState('time')
  const [showCode, setShowCode]= useState(false)
  const [code, setCode]= useState('')
  const [codeLoading, setCodeLoading]= useState(false)
  const color= ALGO_COLORS[algo] || '#333'

  const openCode= ()=> {
    setShowCode(true)
    if (!code) {
      setCodeLoading(true)
      fetch(`${API_BASE}/api/knapsack/algorithm-code/${algo}`)
        .then((r)=> r.json())
        .then((data)=> setCode(data.source || data.detail || 'No source found.'))
        .catch(()=> setCode('Could not load source. Ensure that the backend is running'))
        .finally(()=> setCodeLoading(false))
    }
  }

  const fractionById= useMemo(()=> {
    const map= {}
    ;(result?.selectedItems || []).forEach((entry)=> {
      if (typeof entry === 'string') map[entry]=1
      else map[entry.id]= entry.fraction
    })
    return map
  }, [result])

  const usedWeight= items.reduce((s, it)=> s+(fractionById[it.id]||0)*it.weight,0)

  const chartData= (result?.history || []).map((p)=> ({
    x: xMode=== 'time'? Math.round(p.t):p.step,
    value: p.value,
  }))

  return (
    <div className="result-panel">
      <div className="result-header">
        <span className="algo-name" style={{color}}>{algo.replace(/_/g, ' ')}</span>
        <span>
          <span className="stat-chip">best:{result?.bestValue != null ? `${result.bestValue.toFixed?.(1) ??result.bestValue}pts`:'-'}</span>
          <span className="stat-chip">weight:{usedWeight.toFixed(1)}/{capacity} kg</span>
          <span className="stat-chip">time:{result?.elapsedMs != null?`${result.elapsedMs.toFixed(0)} ms`:'0 ms'}</span>
          <span className="stat-chip">{result?.status || 'idle'}</span>
        </span>
        <span className="view-toggle">
          <button className={view=== 'items' ? '':'secondary'} 
          onClick={()=> setView('items')}>Items</button>{' '}
          <button className={view=== 'graph' ? '':'secondary'} 
          onClick={()=> setView('graph')}>Graph</button>{' '}
          <button className="secondary" onClick={openCode}>{'</>'} Code</button>
        </span>
      </div>
      {result?.status=== 'error' && (
        <div style={{
          padding:'4px 12px',
          fontSize: 11,
          color:'#c0392b'
          }}>
          {result.errorMessage ||'Connection error. Check the backend is running on port 8000.'}
        </div>
      )}

      {result?.possibleSubsets != null && (
        <div style={{
          padding:'4px 12px',
          fontSize:11,
          color:'#5c7a8a'
          }}>
          Possible subsets for {items.length} items:{result.possibleSubsets.toLocaleString()}
        </div>
      )}
      {view=== 'items' ? (
        <div style={{
          padding: 12,
          display:'flex',
          flexWrap: 'wrap',
          gap: 8,
          minHeight:240
          }}>
          {items.map((it)=> {
            const fraction= fractionById[it.id] || 0
            const included= fraction>0
            return (
              <div
                key={it.id}
                style={{
                  width:110,
                  borderRadius: 8,
                  padding: 8,
                  textAlign: 'center',
                  fontSize: 11,
                  border: `2px solid ${included ? color:'#cfe9f7'}`,
                  background: included? `${color}22`:'#f9fbfc',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {fraction>0 && fraction<1 && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '100%',
                    height: `${fraction * 100}%`,
                    background: `${color}33`,
                    zIndex: 0,
                  }}/>
                )}
                <div style={{
                   position: 'relative',
                   zIndex: 1
                   }}>
                  <div style={{fontWeight:700}}>{it.name}</div>
                  <div>{it.weight}kg/{it.value}pt</div>
                  {fraction>0 && fraction<1 && <div style={{color}}>{Math.round(fraction*100)}% taken</div>}
                </div>
              </div>
            )
          })}
        </div>
      ):(
        <div style={{padding:10}}>
          <div style={{marginBottom:6}}>
            <button className={xMode=== 'time'? '':'secondary'} onClick={()=> setXMode('time')}>vs Time</button>{' '}
            <button className={xMode=== 'step'? '':'secondary'} onClick={()=> setXMode('step')}>vs Step</button>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 0
              }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="x" label={{
                value: xMode=== 'time'? 'ms':'step',
                position: 'insideBottom',
                offset:-5 }}
                />
              <YAxis label={{
                value: 'value',
                angle: -90,
                position: 'insideLeft'
                }}/>
              <ChartTooltip/>
              <Line type="monotone" dataKey="value" stroke={color} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {showCode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={()=> setShowCode(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 16,
              maxWidth: '80vw',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
            }}
            onClick={(e)=> e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8
              }}>
              <strong>{algo.replace(/_/g, ' ')}: source</strong>
              <button className="secondary" onClick={()=> setShowCode(false)}>X Close</button>
            </div>
            <pre style={{ 
              fontSize:12,
              background: '#f4fbff',
              padding: 12,
              borderRadius: 6,
              overflow: 'auto'
              }}>
              <code>{codeLoading? 'Loading…' : code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}