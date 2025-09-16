import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Backtest from './pages/Backtest'
import Portfolio from './pages/Portfolio'
import DataView from './pages/DataView'

function App() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-60 h-120 m-5 bg-gray text-black p-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Portfolio Management System</h2>
        <Link to="/" className="
          block py-2 text-sm hover:bg-blue-400 rounded px-2
          transition-colors duration-200 ease-in-out
        ">
          Home
        </Link>
        <Link to="/dataview" className="
          block py-2 text-sm hover:bg-blue-400 rounded px-2
          transition-colors duration-200 ease-in-out
        ">Data View</Link>
        <Link to="/backtest" className="
          block py-2 text-sm hover:bg-blue-400 rounded px-2
          transition-colors duration-200 ease-in-out
        ">
          Backtest
        </Link>
        <Link to="/portfolio" className="
          block py-2 text-sm hover:bg-blue-400 hover:text-black rounded px-2
          transition-colors duration-200 ease-in-out
        ">
          Portfolio
        </Link>
      </div>
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dataview" element={<DataView />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
