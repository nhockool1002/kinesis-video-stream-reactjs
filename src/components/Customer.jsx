import React from 'react';
import { Link } from 'react-router-dom';
import { CardImg, Container, Row } from 'reactstrap';
import guid from 'guid'

function Customer(props) {
  return (
    <Container>
      <br />
      <Row>
        <Link to={`/kvs/viewer/${guid.raw()}`} color='info' style={{margin: '0 auto'}}>
          <CardImg src="https://static.thenounproject.com/png/15876-200.png" />
        </Link>
      </Row>
    </Container>
  );
}

export default Customer;