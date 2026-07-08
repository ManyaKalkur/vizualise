import React from 'react'

export default function KnapsackOverview({ items }) {
  return (
    <div style={{
      flex: 1,
      padding: 24,
      overflowY: 'auto',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignContent: 'flex-start'
    }}>
      {items.map((it)=> (
        <div
          key={it.id}
          style={{
            border:'1px solid #cfe9f7',
            borderRadius: 10,
            padding: 12,
            width: 140,
            background: 'white',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontWeight:700,
            fontSize: 13,
            marginBottom:4
          }}>{it.name}</div>
          <div style={{
            fontSize: 12,
            color:'#5c7a8a'
          }}>{it.weight} kg</div>
          <div style={{
            fontSize: 12,
            color:'#2f7ea8'
          }}>{it.value} pts</div>
        </div>
      ))}
      {items.length=== 0 && <div style={{color:'#5c7a8a'}}>No items selected yet.</div>}
    </div>
  )
}