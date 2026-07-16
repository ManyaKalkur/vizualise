import React, {useState,useEffect} from 'react'
import Landing from './Landing.jsx'
import TSPApp from './apps/TSPApp.jsx'
import KnapsackApp from './apps/KnapsackApp.jsx'
import AssignmentApp from './apps/AssignmentApp.jsx'

const VALID_PAGES= ['tsp','knapsack','assignment']
function getPageFromHash() {
  const h = window.location.hash.replace('#/', '')
  return VALID_PAGES.includes(h) ? h : 'landing'
}
export default function App() {
  const [page, setPage]= useState(getPageFromHash())
  useEffect(()=> {
    window.location.hash= page=== 'landing'? '':`/${page}`},[page])
  useEffect(()=> {
    const onHashChange= ()=> setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return ()=> window.removeEventListener('hashchange', onHashChange)
  }, [])
  if (page=== 'tsp') return <TSPApp onBack={()=> setPage('landing')}/>
  if (page=== 'knapsack') return <KnapsackApp onBack={()=> setPage('landing')}/>
  if (page=== 'assignment') return <AssignmentApp onBack={()=> setPage('landing')}/>
  return <Landing onSelect={setPage}/>
}