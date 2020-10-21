import React, { useEffect, useState } from 'react'
import PropTypes from "prop-types";
import { Button, Table } from 'reactstrap'
import * as KinesisVideoHelper from '../helpers'
import { addList } from '../feature/listSignalSlice'
import { useDispatch } from 'react-redux'
import guid from 'guid'
import socketIOClient from 'socket.io-client'
import { NavLink } from 'react-router-dom';

SignalTable.propTypes = {
  onClick: PropTypes.func
}

SignalTable.defaultProps = {
  onClick: null
}

function SignalTable(props) {
  const { onClick } = props
  const [data, setData] = useState([])
  const dispatch = useDispatch()
  const socket = socketIOClient(`${process.env.REACT_APP_API_BASE_URL}:${process.env.REACT_APP_API_PORT}`);

  useEffect(() => {
    socket.on('endCalling', () => {
      window.location.reload();
    })
    socket.on('reloadFromClient', () => {
      window.location.reload();
    })
  });

  useEffect(() => {
    const fetchData = async () => {
      const result = await KinesisVideoHelper.showSignalChannel()
      const newArr = [...result]
      newArr.forEach((item) => (item.id = guid.raw()))
      setData(newArr)
    }
    fetchData()
  }, [])

  function handleClick(item) {
    if (onClick) {
      return onClick(item)
    }
  }

  const action = addList(data)
  dispatch(action)

  return (
    <Table hover borderless striped>
      <thead>
        <tr>
          <th>SignalName</th>
          <th>Open</th>
          <th>Join</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.ChannelName}</td>
            <td>
              <NavLink color="info" to={`/kvs/master/${item.id}`} className="btn btn-danger" target="_blank">
                OPEN MEETING
              </NavLink>
            </td>
            <td>
            <Button color="info" onClick={() => handleClick(item)}>
                JOIN
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default SignalTable
