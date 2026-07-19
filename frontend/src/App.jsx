import React, {useState,useEffect} from 'react'
import Landing from './Landing.jsx'
import TSPApp from './apps/TSPApp.jsx'
import KnapsackApp from './apps/KnapsackApp.jsx'
import AssignmentApp from './apps/AssignmentApp.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'

const API_BASE= 'https://vizualise.onrender.com'
const VALID_PAGES= ['tsp','knapsack','assignment']
function getPageFromHash() {
  const h = window.location.hash.replace('#/', '')
  return VALID_PAGES.includes(h) ? h : 'landing'
}
export default function App() {
  const [page, setPage]= useState(getPageFromHash())
  const [backendReady, setBackendReady]= useState(false)
  const [seconds, setSeconds]= useState(0)
  useEffect(() => {
    let cancelled= false
    const startedAt= Date.now()
    const check= ()=> {
      fetch(`${API_BASE}/api/cities/national`)
        .then((res)=> {
          if (!res.ok) throw new Error()
          if (!cancelled) setBackendReady(true)
        })
        .catch(()=> {
          if (!cancelled) setTimeout(check, 3000)
        })
    }
    check()
    const tick= setInterval(()=> {
      if (!cancelled)
        setSeconds(Math.floor((Date.now()-startedAt)/1000))
    }, 1000)
    return ()=> {
      cancelled= true
      clearInterval(tick)
    }
  }, [])
  useEffect(()=> {
    window.location.hash= page=== "landing"?"":`/${page}`
  }, [page])
  useEffect(()=> {
    const onHashChange= ()=> setPage(getPageFromHash())
    window.addEventListener("hashchange", onHashChange)
    return ()=>
      window.removeEventListener("hashchange", onHashChange)
  }, [])

  if (!backendReady) return <LoadingScreen seconds={seconds}/>
  if (page=== "tsp") return <TSPApp onBack={()=> setPage("landing")}/>
  if (page=== "knapsack") return <KnapsackApp onBack={()=> setPage("landing")}/>
  if (page=== "assignment") return <AssignmentApp onBack={()=> setPage("landing")}/>
  return <Landing onSelect={setPage} />
}