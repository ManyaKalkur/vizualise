import React from 'react'

export default function AssignmentOverview({workers, jobs, costMatrix}) {
  return (
    <div style={{
      flex: 1,
      padding: 24,
      overflow: 'auto'
    }}>
      <table style={{
        borderCollapse: 'collapse',
        margin: '0 auto',
        background: 'white'
        }}>
        <thead>
          <tr>
            <th style={cellStyle(true)}></th>
            {jobs.map((j)=> <th key={j} style={cellStyle(true)}>{j}</th>)}
          </tr>
        </thead>
        <tbody>
          {workers.map((w, i)=> (
            <tr key={w}>
              <th style={cellStyle(true)}>{w}</th>
              {costMatrix[i]?.map((cost, j)=> (
                <td key={j} style={cellStyle(false)}>{cost}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cellStyle(header) {
  return {
    border:'1px solid #cfe9f7',
    padding:'8px 12px',
    fontSize:12,
    textAlign:'center',
    background: header? '#eaf6ff':'white',
    color: header? '#2f7ea8':'#1f3b4d',
    fontWeight: header? 700:400,
  }
}