import React from 'react'

export default function LoadingScreen({ seconds }) {
  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      background:'var(--bg-main)',
      color:'var(--text)',
      fontFamily:'system-ui,sans-serif',
      textAlign:'center',
      padding:24,
    }}>
      <div style={{
        width:40,
        height:40,
        border:'4px solid var(--border)',
        borderTopColor:'var(--accent)',
        borderRadius:'50%',
        animation:'spin 1s linear infinite',
        marginBottom:16,
      }}/>
      <style>{'@keyframes spin { to {transform:rotate(360deg) } }'}</style>
      <h3 style={{
        color:'var(--accent-dark)',
        margin:'0 0 6px 0'
        }}>Waking up the server…</h3>
      <p style={{
        fontSize:13,
        color:'var(--text-light)',
        maxWidth:340,
        }}>
        {seconds<15
          ? 'Connecting to the backend.'
          :'The free-tier server sleeps after inactivity. This can take up to a minute on first load. Almost there.'}
      </p>
    </div>
  )
}