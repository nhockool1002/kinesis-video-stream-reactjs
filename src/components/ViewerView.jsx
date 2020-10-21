import React, { useEffect, useRef } from 'react';
import { appStore } from '../constant/global-config';
import { Button, Col, Container, Row } from 'reactstrap';
import { useParams } from 'react-router';
import { startViewer } from 'init/start-viewer'
import socketIOClient from 'socket.io-client'
import * as KinesisVideoHelper from '../helpers'


function ViewerView(props) {
  const { onViewerStopCalling } = props;
  appStore.master.view.local.ref = useRef(null);
  appStore.master.view.remote.ref = useRef(null);
  appStore.viewer.view.local.ref = useRef(null);
  appStore.viewer.view.remote.ref = useRef(null);
  const socket = socketIOClient(`${process.env.REACT_APP_API_BASE_URL}:${process.env.REACT_APP_API_PORT}`);

  const {id} = useParams();
  useEffect(() => {
    const creteSignalChannel = async () => {
      await KinesisVideoHelper.createSignalChannel(id).then(() => {
        socket.emit('reloadFromClient');
        startViewer(appStore.viewer.view.local.ref, appStore.viewer.view.remote.ref, id)
      })
    }
    creteSignalChannel();
  });

  useEffect(() => {
    socket.on('endCallingViewer', () => {
      window.close();
    })
  });

  function stopCalling(data) {
    if (onViewerStopCalling) {
      return onViewerStopCalling(data)
    }
  }
  return (
    <div>
      <Container fluid={true}>
        <Row>
          <Col sm={9}>
            <Col sm={12}>
              <h3>My ID : {id}</h3>
            </Col>
          <video
              className="local-view"
              width="100%"
              height="720px"
              src={appStore.viewer.view.local.srcObject}
              ref={appStore.viewer.view.local.ref}
              autoPlay playsInline controls muted 
            />
          </Col>
          <Col sm={3}>
            <Col sm={12}>
              <h3>HOST</h3>
            </Col>
            <video
                className="remote-view"
                width="100%"
                height="100%"
                src={appStore.viewer.view.remote.srcObject}
                ref={appStore.viewer.view.remote.ref}
                autoPlay playsInline controls muted 
              />
          </Col>
        </Row>
      </Container>

      <Button type='button' color="danger" onClick={() => stopCalling(id)} style={{margin: '0 auto'}}>STOP CALLING</Button>
    </div>
  );
}

export default ViewerView;