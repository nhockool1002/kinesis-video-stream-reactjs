import React from 'react';
import { appStore } from '../constant/global-config';
import { Button, Col, Container, Row } from 'reactstrap';


function ViewerView(props) {
  const { testViewer } = props;
  return (
    <div>
      <Container fluid={true}>
        <Row>
        <Col sm={12}>
            <h1>VIEWERVIEW</h1>
          </Col>
          <Col sm={9}>
          <video
              className="local-view"
              width="100%"
              height="100%"
              src={appStore.viewer.view.local.srcObject}
              ref={appStore.viewer.view.local.ref}
              autoPlay playsInline controls muted 
            />
          </Col>
          <Col sm={3}>
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

      <Button type='button' color="danger" onClick={testViewer}>CLICK</Button>
    </div>
  );
}

export default ViewerView;