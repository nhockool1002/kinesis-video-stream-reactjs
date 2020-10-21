import React from 'react';
import { startMaster, stopMaster } from '../init/start-master';
import { startViewer, stopViewer } from '../init/start-viewer';
import { appStore } from '../constant/global-config';
import { useRef } from 'react';
import ViewerView from './ViewerView';
import MasterView from './MasterView';
import { BrowserRouter, Route, Switch, useHistory } from 'react-router-dom';
import socketIOClient from 'socket.io-client'
import * as KinesisVideoHelper from 'helpers'
import {
  KINESIS_CHANNEL_NAME
} from '../constant/setup'

function Kinesis() {

  appStore.master.view.local.ref = useRef(null);
  appStore.master.view.remote.ref = useRef(null);
  appStore.viewer.view.local.ref = useRef(null);
  appStore.viewer.view.remote.ref = useRef(null);
  const history = useHistory();
  const socket = socketIOClient(`${process.env.REACT_APP_API_BASE_URL}:${process.env.REACT_APP_API_PORT}`);
  
  function testMaster() {
    appStore.master.showVideoPlayers = true
    startMaster(appStore.master.view.local.ref, appStore.master.view.remote.ref, KINESIS_CHANNEL_NAME);
  }

  function testViewer() {
    appStore.viewer.showVideoPlayers = true
    startViewer(appStore.viewer.view.local.ref, appStore.viewer.view.remote.ref, KINESIS_CHANNEL_NAME);
  }

  const handleOnEndCalling = async (id, data) => {
    localStorage.removeItem(id);
    await KinesisVideoHelper.deleteSignalChannel(data)
    .then(() => {
      stopMaster();
      socket.emit('endCalling');
      window.close();
    })
    .catch(() => {
      stopMaster();
      socket.emit('endCalling');
      window.close();
    });
  }

  const handleOnViewerCalling = async (data) => {
    await KinesisVideoHelper.deleteSignalChannel(data)
    .then(() => {
      stopViewer();
      history.push('/customer')
    })
    .catch(() => {
      stopViewer();
      history.push('/customer')
    });
  }
  return (
    <div>
      <BrowserRouter>
        <Switch>
          <Route exact path="/kvs/master/:id">
            <MasterView testMaster={testMaster} onEndCalling={handleOnEndCalling} />
          </Route>
          <Route exact path="/kvs/viewer/:id">
            <ViewerView testViewer={testViewer} onViewerStopCalling={handleOnViewerCalling} />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default Kinesis;