import React, { useEffect, useRef, useState } from 'react';
import { appStore } from '../constant/global-config';
import { Button, Col, Container, Row } from 'reactstrap';
import { startMaster } from 'init/start-master'
import socketIOClient from 'socket.io-client'
import { useParams } from 'react-router';


function MasterView(props) {
  const { onEndCalling } = props;
  appStore.master.view.local.ref = useRef(null);
  appStore.master.view.remote.ref = useRef(null);
  appStore.viewer.view.local.ref = useRef(null);
  appStore.viewer.view.remote.ref = useRef(null);
  const [show, setShow] = useState({display: 'none'})
  const [showStart, setShowStart] = useState({display: 'block'})
  const {id} = useParams();
  const socket = socketIOClient(`${process.env.REACT_APP_API_BASE_URL}:${process.env.REACT_APP_API_PORT}`);

  useEffect(() => {
    socket.on('joinMeetingRoom', (data) => {
      localStorage.setItem(id, data.data.ChannelName);
      setShow({display: 'block', margin: '0 auto'})
      startMaster(appStore.master.view.local.ref, appStore.master.view.remote.ref, data.data.ChannelName);
    })
  });

  function onHandleEndCalling(id, data) {
    if (onEndCalling) {
      return onEndCalling(id, data)
    }
  }

  function startMasterNow() {
    startMaster(appStore.master.view.local.ref, appStore.master.view.remote.ref, id);
    setShowStart({display: 'none'})
    setShow({display: 'block'})
  }
  return (
    <div>
      <Container fluid={true}>
        <Row>
          <Col sm={9}>
            <Col sm={12}>
              <h3>Host</h3>
            </Col>
          <video
              className="local-view"
              width="100%"
              height="720px"
              src={appStore.master.view.local.srcObject}
              ref={appStore.master.view.local.ref}
              autoPlay playsInline controls muted 
            />
          </Col>
          <Col sm={3}>
            <Col sm={12}>
              <h5>Client: {id}</h5>
            </Col>
            <video
                className="remote-view"
                width="100%"
                height="100%"
                src={appStore.master.view.remote.srcObject}
                ref={appStore.master.view.remote.ref}
                autoPlay playsInline controls muted 
              />
          </Col>
        </Row>
      </Container>
      <Button 
        type='button'
        color="success" 
        onClick={startMasterNow}
        style={showStart}
      >
        JOIN
      </Button>
      <Button 
        type='button'
        color="danger" 
        onClick={() => onHandleEndCalling(id, localStorage.getItem(id))}
        style={show}
      >
        END CALLING
      </Button>
    </div>
  );
}

export default MasterView;