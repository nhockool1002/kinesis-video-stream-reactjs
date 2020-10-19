import React, {Suspense} from 'react';
import './App.css';
import Kinesis from './components/Kinesis';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div>Loading ...</div>}>
        <BrowserRouter>

            <Switch>
              <Redirect exact from="/" to="/kvs" />
              <Route path="/kvs" component={Kinesis} />
            </Switch>
        </BrowserRouter>
      </Suspense>
    </div>
  );
}

export default App;
