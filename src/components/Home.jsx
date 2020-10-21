import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

function Home(props) {
  return (
    <div>
      <br />
      <Container style={{border: '1px solid black', textAlign: 'center'}}>
        <Row>
          <Col sm={6}>
            <h1>Customer</h1>
          </Col>
          <Col sm={6}>
            <Link to='/customer' className='btn btn-warning'>Customer</Link>
            <br />
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <h1>Admin</h1>
          </Col>
          <Col sm={6}>
            <Link to='/calling-management' className='btn btn-info'>Admin</Link>
            <br />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;