import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Changed to App
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Changed to <App /> */}
  </React.StrictMode>,
)