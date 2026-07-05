import React from 'react'

const CARDS=[
  {
    id:'tsp',
    title:'Traveling Salesman',
    desc:'Race TSP algorithms across a live map of India.',
    ready: true
  },
  {
    id:'knapsack',
    title:'Knapsack Problem',
    desc:'Watch algorithms pack the bag.',
    ready: true },
  { 
    id:'assignment',
    title:'Assignment Problem',
    desc:'Hungarian Algorithm assigning workers to jobs.',
    ready:true
  },
]

export default function Landing({onSelect}) {
  return (
    <div style={{
      minHeight:'100vh',
      background:'var(--bg-main)',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      padding: 24,
    }}>
      <h1 style={{
        color:'var(--accent-dark)',
        marginBottom:4 
        }}>Optimization Algorithms Visualizer</h1>
      <p style={{
        color:'var(--text-light)',
        marginBottom:32
        }}>Pick a problem to explore.</p>
      <div style={{
        display:'flex',
        gap: 20,
        flexWrap:'wrap',
        justifyContent:'center'
        }}>
        {CARDS.map((c)=> (
          <div
            key={c.id}
            onClick={()=> c.ready && onSelect(c.id)}
            style={{
              width: 260,
              padding: 24,
              borderRadius: 14,
              background: 'white',
              border:'1px solid var(--border)', 
              textAlign:'center',
              cursor:c.ready?'pointer':'not-allowed',
              opacity:c.ready?1:0.5,
              boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{
              color: 'var(--accent-dark)',
              marginBottom: 8 }}>{c.title}</h3>
            <p style={{
              fontSize: 13,
              color: 'var(--text-light)'
              }}>{c.desc}</p>
            {!c.ready && <div style={{
              fontSize: 11,
              marginTop: 8,
              color: '#c0392b'
              }}>Coming soon</div>}
          </div>
        ))}
      </div>
    </div>
  )
}