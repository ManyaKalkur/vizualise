import { useCallback, useRef, useState } from 'react'

const WS_URL= 'wss://vizualise.onrender.com/ws/run'
export function useKnapsackRun() {
  const [results, setResults]= useState({})
  const [running, setRunning]= useState(false)
  const wsRef= useRef(null)
  const reset= useCallback(()=> {
    setResults({})
    setRunning(false)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current= null
    }
  }, [])
  const runAll= useCallback((requests)=> {
    reset()
    setRunning(true)
    const initial= {}
    requests.forEach((r)=> {
      initial[r.run_id]= {
        algo: r.algo,
        bestValue: null,
        elapsedMs: 0,
        possibleSubsets: null,
        selectedItems: [],
        history: [],
        status: 'connecting',
      }
    })
    setResults(initial)
    const ws= new WebSocket(WS_URL)
    wsRef.current= ws
    ws.onopen= ()=> ws.send(JSON.stringify({requests}))
    ws.onmessage= (event)=> {
      const msg= JSON.parse(event.data)
      if (msg.type=== 'all_done') {
        setRunning(false)
        return
      }
      if (msg.type=== 'error') {
        console.error('Server error:', msg.message)
        setRunning(false)
        setResults((prev)=> {
          const next= {...prev}
          Object.keys(next).forEach((k)=> {next[k]= {
            ...next[k],
            status: 'error',
            errorMessage: msg.message
          } })
          return next
        })
        return
      }
      const runId= msg.run_id
      if (!runId) return
      setResults((prev)=> {
        const cur= prev[runId] || { history: [] }
        if (msg.type=== 'meta') {
          return {...prev, [runId]: { ...cur,
            possibleSubsets: msg.possible_subsets,
            status: 'running'
          } }
        }
        if (msg.type=== 'finished') {
          return {...prev, [runId]: {
            ...cur,
            status: 'finished',
            elapsedMs: msg.elapsed_ms
          } }
        }
        if (msg.type=== 'done' && msg.error) {
          return {...prev, [runId]: {
            ...cur,
            status: 'error',
            errorMessage: msg.error
          } }
        }
        const historyEntry= {
          t: msg.elapsed_ms,
          step: msg.step_no,
          value: msg.best_value
        }
        return {
          ...prev,
          [runId]: {
            ...cur,
            bestValue: msg.best_value ?? cur.bestValue,
            selectedItems: msg.selected_items ?? cur.selectedItems,
            elapsedMs: msg.elapsed_ms,
            status: msg.type === 'done'?'done':'running',
            history: [...cur.history, historyEntry],
          },
        }
      })
    }
    ws.onerror= ()=> {
      setRunning(false)
      setResults((prev)=> {
        const next= {...prev}
        Object.keys(next).forEach((k)=> {
          if (next[k].status=== 'connecting') {
            next[k]= {
              ...next[k],
              status: 'error',
              errorMessage: 'Could not reach backend at '+ WS_URL
            }
          }
        })
        return next
      })
    }
    ws.onclose= ()=> {
      setRunning(false)
      setResults((prev)=> {
        const next= {...prev}
        Object.keys(next).forEach((k)=> {
          if (next[k].status=== 'connecting' || next[k].status=== 'running') {
            next[k] = {
              ...next[k],
              status: next[k].status=== 'connecting'?'error':'finished'}
          }
        })
        return next
      })
    }
  }, [reset])
  return { results, running, runAll, reset }
}