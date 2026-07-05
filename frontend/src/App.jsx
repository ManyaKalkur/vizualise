import React, {useState} from 'react'
import Landing from './Landing.jsx'
import TSPApp from './apps/TSPApp.jsx'
import KnapsackApp from './apps/KnapsackApp.jsx'
import AssignmentApp from './apps/AssignmentApp.jsx'

export default function App() {
  const [page, setPage] = useState('landing')
  if (page=== 'tsp')
    return <TSPApp onBack={()=> setPage('landing')}/>
  if (page=== 'knapsack')
    return <KnapsackApp onBack={()=> setPage('landing')}/>
  if (page=== 'assignment')
    return <AssignmentApp onBack={()=> setPage('landing')}/>
  return <Landing onSelect={setPage}/>
}