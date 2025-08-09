import { Link } from 'lucide-react'
import React from 'react'

const Header = () => {
  return (

    <div>

      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          URL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Shortener</span>
        </h1>
        <p className="text-blue-200 text-lg mb-6">Transform your long URLs into short, shareable links</p>
      </div>
    </div>
  )
}

export default Header