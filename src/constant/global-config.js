import { store } from '@risingstack/react-easy-state'

function getRandomClientId() {
  return Math.random().toString(36).substring(2).toUpperCase()
}

const appStore = store({
  useTrickleICE: true,
  openDataChannel: true,
  clientId: getRandomClientId(),
  channelName: '',
  channelARN: '',
  master: {
    showVideoPlayers: false,
    signalingClient: null,
    peerConnectionByClientId: {},
    dataChannelByClientId: {},
    localStream: null,
    remoteStreams: [],
    peerConnectionStatsInterval: null,
    view: {
      local: {
        srcObj: null,
        ref: null
      },
      remote: {
        srcObj: null,
        ref: null
      }
    }
  },
  viewer: {
    showVideoPlayers: false,
    view: {
      local: {
        srcObject: null,
        ref: null
      },
      remote: {
        srcObject: null,
        ref: null
      }
    }
  }
})

export { appStore }
