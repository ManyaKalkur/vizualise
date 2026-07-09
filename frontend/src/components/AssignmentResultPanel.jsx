import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts'

const API_BASE= 'https://vizualise.onrender.com/'
const ALGO_COLORS= {
  greedy_assignment: '#f4a261',
  hungarian_algorithm: '#2a9d8f',
  brute_force: '#8338ec',
  branch_and_bound: '#ff006e',
}

export default function AssignmentResultPanel({algo, workers, jobs, costMatrix, result}) {
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
      fetch(`${API_BASE}/api/assignment/algorithm-code/${algo}`)
        .then((r)=> r.json())
        .then((data)=> setCode(data.source || data.detail || 'No source found.'))
        .catch(()=> setCode('Could not load source. Ensure that the backend is running'))
        .finally(()=> setCodeLoading(false))
    }
  }

  const displayMatrix= result?.matrix||costMatrix
  const assignment= result?.assignment
  const chartData= (result?.history|| []).map((p)=> ({
    x:xMode==='time'? Math.round(p.t):p.step,
    value: p.value,
  }))
  return (
    <div className="result-panel">
      <div className="result-header">
        <span className="algo-name" style={{color}}>{algo.replace(/_/g, ' ')}</span>
        <span>
          <span className="stat-chip">best:{result?.bestValue!= null? result.bestValue:'-'}</span>
          <span className="stat-chip">time:{result?.elapsedMs!= null? `${result.elapsedMs.toFixed(0)} ms`:'0 ms'}</span>
          <span className="stat-chip">{result?.status || 'idle'}</span>
          {result?.stage && <span className="stat-chip">{result.stage}</span>}
        </span>
        <span className="view-toggle">
          <button className={view=== 'matrix'?'':'secondary'} 
          onClick={()=> setView('matrix')}>Matrix</button>{' '}
          <button className={view=== 'graph'?'':'secondary'}
          onClick={()=> setView('graph')}>Graph</button>{' '}
          <button className="secondary" onClick={openCode}>{'</>'} Code</button>
        </span>
      </div>

      {result?.status === 'error' && (
        <div style={{
          padding: '4px 12px',
          fontSize: 11,
          color: '#c0392b'
          }}>
          {result.errorMessage || 'Connection error. Check the backend is running on port 8000.'}
        </div>
      )}
      {result?.possibleAssignments != null && (
        <div style={{
          padding: '4px 12px',
          fontSize: 11,
          color: '#5c7a8a'
          }}>
          Possible assignments for {workers.length} workers: {result.possibleAssignments.toLocaleString()}
        </div>
      )}
      {view=== 'matrix' ? (
        <div style={{
          padding: 12,
          overflow: 'auto'
          }}>
          <table style={{
            borderCollapse: 'collapse',
            margin: '0 auto',
            fontSize: 11
            }}>
            <thead>
              <tr>
                <th style={cellStyle(true, false)}></th>
                {jobs.map((j)=> <th key={j} style={cellStyle(true, false)}>{j}</th>)}
              </tr>
            </thead>
            <tbody>
              {workers.map((w, i)=> (
                <tr key={w}>
                  <th style={cellStyle(true, false)}>{w}</th>
                  {displayMatrix[i]?.map((cost, j)=> {
                    const isAssigned= assignment && assignment[i]===j
                    return (
                      <td key={j} style={cellStyle(false, isAssigned, color)}>
                        {cost}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ):(
        <div style={{padding:10}}>
          <div style={{marginBottom:6}}>
            <button className={xMode=== 'time'?'':'secondary'} 
            onClick={()=> setXMode('time')}>vs Time</button>{' '}
            <button className={xMode=== 'step'?'':'secondary'} 
            onClick={()=> setXMode('step')}>vs Step</button>
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
                value: xMode === 'time'?'ms':'step',
                position: 'insideBottom',
                offset:-5
              }}/>
              <YAxis label={{
                value: 'cost',
                angle: -90,
                position: 'insideLeft'
                }}/>
              <ChartTooltip/>
              <Line type="monotone" dataKey="value" stroke={color} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
          {chartData.length === 0 && (
            <div style={{
              fontSize: 11,
              color: '#5c7a8a',
              textAlign: 'center',
              marginTop: 20
            }}>
              This algorithm doesn't track an evolving cost curve, check the Matrix view instead.
            </div>
          )}
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
              fontSize: 12,
              background: '#f4fbff',
              padding: 12,
              borderRadius: 6,
              overflow: 'auto'
              }}>
              <code>{codeLoading? 'Loading…':code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function cellStyle(header, assigned, color) {
  return {
    border: '1px solid #cfe9f7',
    padding: '6px 10px',
    textAlign: 'center',
    background: assigned?`${color}33`: header?'#f5fbff':'white',
    color: header?'#2f7ea8':'#1f3b4d',
    fontWeight: header||assigned?700:400,
    outline: assigned? `2px solid ${color}`:'none',
  }
}