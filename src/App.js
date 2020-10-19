import React, { Suspense } from 'react'
import 'App.css'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import Kinesis from 'components/Kinesis.jsx'

function App() {
  return (
    <div className="App">
      <h2>Hello !</h2>
      <Suspense fallback={<div>Loading ...</div>}>
        <BrowserRouter>
          <Switch>
            <Redirect exact from="/" to="/kvs" />
            <Route path="/kvs" component={Kinesis} />
          </Switch>
        </BrowserRouter>
      </Suspense>
    </div>
  )
}

export default App
