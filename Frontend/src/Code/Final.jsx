import React from 'react'
import Header from './Header'
import Navigation from './Navigation'
import Logic from './Logic'
import Footer from './Footer'

const Final = () => {
  return (
    <div>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8"></div>
        <Header/>
        <Logic/>
        <Footer/>
        </div>
        
    </div>
  )
}


export default Final