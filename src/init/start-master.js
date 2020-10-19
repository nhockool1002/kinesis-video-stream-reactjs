import KinesisVideoSignalingChannels from 'aws-sdk/clients/kinesisvideosignalingchannels';
import { SignalingClient } from 'amazon-kinesis-video-streams-webrtc';
import { appStore } from '../constant/global-config';
import {
  AWS_REGION,
  MASTER_ROLE,
  STUN_TURN,
  STATE_DISABLED,
  STUN_ONLY,
  ACCEPT_SEND_VIDEO,
  ACCEPT_SEND_AUDIO,
  MASTER_COULD_NOT_FIND_CAMERA
} from '../constant/setup'
import * as KinesisVideoHelper from '../helpers'

const startMaster = async function(localView, remoteView, channelName) {
  console.log('|-> Khởi tạo credentials ...')
  const credentials = KinesisVideoHelper.credentials();

  // Tạo KVS Client
  console.log('|-> Khởi tạo KVS Client ...')
  const kinesisvideoClient = KinesisVideoHelper.createNewKinesisVideo();

  // Lấy Signaling Channel ARN
  console.log('|-> Lấy Signaling Channel ARN ...')
  const describeSignalingChannelResponse = await KinesisVideoHelper.describeSignalingChannel(channelName);
  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log('[MASTER] ChannelARN: ', channelARN)

  // Lấy Signaling channel endpoints
  console.log('|-> Lấy Signaling channel endpoints')
  const getSignalingChannelEndpointResponse = await kinesisvideoClient
  .getSignalingChannelEndpoint({
    ChannelARN: channelARN,
    SingleMasterChannelEndpointConfiguration: {
      Protocols: ['WSS', 'HTTPS'],
      Role: MASTER_ROLE
    }
  })
  .promise()

  // Lấy Master Endpoint
  console.log('|-> Lấy Master Endpoint')
  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
    endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
    return endpoints;
  }, {});
  console.log('[MASTER] Endpoints: ', endpointsByProtocol);

  // Tạo Signaling Client
  console.log('|-> Tạo Signaling Client')
  appStore.master.signalingClient = new SignalingClient({
    channelARN: channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    credentials: credentials,
    role: MASTER_ROLE,
    region: AWS_REGION,
    systemClockOffset: kinesisvideoClient.config.systemClockOffset
  })
  console.log('master.signalingClient', appStore.master.signalingClient);

  // Khởi tạo thông tin cài đặt ICE Server 
  console.log('|-> hởi tạo thông tin cài đặt ICE Server ')
  const kinesisVideoSignalingChannelsClient = new KinesisVideoSignalingChannels({
    region: AWS_REGION,
    credentials: credentials,
    endpoint: endpointsByProtocol.HTTPS,
    correctClockSkew: true,
  });
  console.log('kinesisVideoSignalingChannelsClient', kinesisVideoSignalingChannelsClient)

  // Lấy thông tin trả về từ ICE Server
  console.log('|-> Lấy thông tin trả về từ ICE Server')
  const getIceServerConfigResponse = await kinesisVideoSignalingChannelsClient
  .getIceServerConfig({
      ChannelARN: channelARN,
  })
  .promise();
  console.log('getIceServerConfigResponse', getIceServerConfigResponse)

  const iceServers = [];

  console.log('Lấy thông tin STUN Server ...')
  iceServers.push({ urls: `stun:stun.kinesisvideo.${AWS_REGION}.amazonaws.com:443` });

  if (STUN_TURN !== STATE_DISABLED) {
      console.log('Lấy thông tin STUN Server ...')
      getIceServerConfigResponse.IceServerList.forEach(iceServer =>
          iceServers.push({
              urls: iceServer.Uris,
              username: iceServer.Username,
              credential: iceServer.Password,
          }),
      );
  }
  console.log('[MASTER] ICE servers: ', iceServers);

  const configuration = {
    iceServers,
    iceTransportPolicy: STUN_TURN === STUN_ONLY ? 'relay' : 'all',
  };

  const resolution = { width: { ideal: 1280 }, height: { ideal: 720 } };
  console.log('resolution', resolution);

  const constraints = {
    video: ACCEPT_SEND_VIDEO ? resolution : false,
    audio: ACCEPT_SEND_AUDIO,
  };
  console.log('constraints', constraints);

  if (ACCEPT_SEND_VIDEO || ACCEPT_SEND_AUDIO) {
    try {
      appStore.master.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      localView.current.srcObject = appStore.master.localStream;
    } catch (e) {
        console.log('ERRORS: ', e)
        console.error(MASTER_COULD_NOT_FIND_CAMERA);
    }
  } 

  console.log('Thêm bắt sự kiện signalingClient.on ...')
  appStore.master.signalingClient.on('open', async () => {
    console.log('[MASTER] Kết nối tới signaling service');
  });

  appStore.master.signalingClient.on('sdpOffer', async (offer, remoteClientId) => {
    console.log('[MASTER] Nhận SDP offer từ client: ' + remoteClientId);

    // Create a new peer connection using the offer from the given client
    const peerConnection = new RTCPeerConnection(configuration);
    appStore.master.peerConnectionByClientId[remoteClientId] = peerConnection;

    if (appStore.openDataChannel) {
      appStore.master.dataChannelByClientId[remoteClientId] = peerConnection.createDataChannel('kvsDataChannel');
        peerConnection.ondatachannel = event => {
            event.channel.onmessage = onRemoteDataMessage;
        };
    }

    // Poll for connection stats
    if (!appStore.master.peerConnectionStatsInterval) {
      appStore.master.peerConnectionStatsInterval = setInterval(() => peerConnection.getStats().then(onStatsReport), 1000);
    }

    // Send any ICE candidates to the other peer
    peerConnection.addEventListener('icecandidate', ({ candidate }) => {
        if (candidate) {
            console.log('[MASTER] Khởi tạo ICE candidate cho client: ' + remoteClientId);

            // When trickle ICE is enabled, send the ICE candidates as they are generated.
            if (appStore.useTrickleICE) {
                console.log('[MASTER] Sending ICE candidate to client: ' + remoteClientId);
                appStore.master.signalingClient.sendIceCandidate(candidate, remoteClientId);
            }
        } else {
            console.log('[MASTER] All ICE candidates have been generated for client: ' + remoteClientId);

            // When trickle ICE is disabled, send the answer now that all the ICE candidates have ben generated.
            if (!appStore.useTrickleICE) {
                console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
                appStore.master.signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);
            }
        }
    });

    // As remote tracks are received, add them to the remote view
    peerConnection.addEventListener('track', event => {
        console.log('[MASTER] Received remote track from client: ' + remoteClientId);
        if (remoteView.current.srcObject) {
            return;
        }
        remoteView.current.srcObject = event.streams[0];
    });

    // If there's no video/audio, master.localStream will be null. So, we should skip adding the tracks from it.
    if (appStore.master.localStream) {
      appStore.master.localStream.getTracks().forEach(track => {peerConnection.addTrack(track, appStore.master.localStream)});
    }
    await peerConnection.setRemoteDescription(offer);

    // Create an SDP answer to send back to the client
    console.log('[MASTER] Creating SDP answer for client: ' + remoteClientId);
    await peerConnection.setLocalDescription(
        await peerConnection.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        }),
    );

    // When trickle ICE is enabled, send the answer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
    if (appStore.useTrickleICE) {
        console.log('[MASTER] Sending SDP answer to client: ' + remoteClientId);
        appStore.master.signalingClient.sendSdpAnswer(peerConnection.localDescription, remoteClientId);
    }
    console.log('[MASTER] Generating ICE candidates for client: ' + remoteClientId);
  });

  appStore.master.signalingClient.on('iceCandidate', async (candidate, remoteClientId) => {
    console.log('[MASTER] Received ICE candidate from client: ' + remoteClientId);

    // Add the ICE candidate received from the client to the peer connection
    const peerConnection = appStore.master.peerConnectionByClientId[remoteClientId];
    peerConnection.addIceCandidate(candidate);
  });

  appStore.master.signalingClient.on('close', () => {
        console.log('[MASTER] Disconnected from signaling channel');
  });

  appStore.master.signalingClient.on('error', () => {
        console.error('[MASTER] Signaling client error');
  });

  console.log('[MASTER] Starting master connection');
  appStore.master.signalingClient.open();
}


function onStatsReport(report) {

}

function onRemoteDataMessage(data) {
  
}

export { startMaster };