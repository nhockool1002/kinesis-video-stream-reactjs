import React from 'react';
import { startMaster } from '../init/start-master';
import { startViewer } from '../init/start-viewer';
import { appStore } from '../constant/global-config';
import { useRef } from 'react';
import ViewerView from './ViewerView';
import MasterView from './MasterView';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import {
  KINESIS_CHANNEL_NAME
} from '../constant/setup'

function Kinesis(props) {

  appStore.master.view.local.ref = useRef(null);
  appStore.master.view.remote.ref = useRef(null);
  appStore.viewer.view.local.ref = useRef(null);
  appStore.viewer.view.remote.ref = useRef(null);
  function testMaster() {
    appStore.master.showVideoPlayers = true
    startMaster(appStore.master.view.local.ref, appStore.master.view.remote.ref, KINESIS_CHANNEL_NAME);
  }

  function testViewer() {
    appStore.viewer.showVideoPlayers = true
    startViewer(appStore.viewer.view.local.ref, appStore.viewer.view.remote.ref, KINESIS_CHANNEL_NAME);
  }
  return (
    <div>
      <BrowserRouter>
        <Switch>
          <Route path="/kvs/master">
            <MasterView testMaster={testMaster} />
          </Route>
          <Route path="/kvs/viewer">
            <ViewerView testViewer={testViewer} />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default Kinesis;