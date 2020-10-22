import React, { Suspense } from 'react'
import 'App.scss'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import Kinesis from 'components/Kinesis.jsx'
import SignalTable from 'components/SignalTable.jsx'
import RainbowText from 'react-rainbow-text'
import { Container, Row, Col } from 'reactstrap'
import socketIOClient from 'socket.io-client'
import Customer from 'components/Customer.jsx'
import Home from 'components/Home.jsx'

function App() {
  const socket = socketIOClient(
    `${process.env.REACT_APP_API_BASE_URL}:${process.env.REACT_APP_API_PORT}`
  )
  const handleClickJoin = (data) => {
    socket.emit('joinMeetingRoom', data)
  }

  return (
    <div className="App">
      <div className="RainbowText">
        <RainbowText lightness={0.5} saturation={1}>
          KINESIS VIDEO STREAM DEMO
        </RainbowText>
      </div>
      <Suspense fallback={<div>Loading ...</div>}>
        <BrowserRouter>
          <Switch>
            <Redirect exact from="/" to="/home" />
            <Route path="/kvs">
              <Kinesis />
            </Route>
            <Route path="/home">
              <Home />
            </Route>
            <Route path="/customer">
              <Customer />
            </Route>
            <Route exact path="/calling-management">
              <Container>
                <Row>
                  <Col sm={12}>
                    <SignalTable onClick={handleClickJoin} />
                  </Col>
                </Row>
              </Container>
            </Route>
          </Switch>
        </BrowserRouter>
      </Suspense>
    </div>
  )
}

export default App
