import KinesisVideoSignalingChannels from 'aws-sdk/clients/kinesisvideosignalingchannels';
import { SignalingClient } from 'amazon-kinesis-video-streams-webrtc';
import { appStore } from '../constant/global-config';
import {
  AWS_REGION,
  VIEWER_ROLE,
  STUN_TURN,
  STATE_DISABLED,
  STUN_ONLY,
  ACCEPT_SEND_VIDEO,
  ACCEPT_SEND_AUDIO,
  VIEWER_COULD_NOT_FIND_CAMERA
} from '../constant/setup'
import * as KinesisVideoHelper from '../helpers'

const startViewer = async function(localView, remoteView, channelName) {
  console.log('localView', localView)
  console.log('remoteView', remoteView.current.srcObject)
  console.log('|-> Khởi tạo credentials ...')
  const credentials = KinesisVideoHelper.credentials();

  // Tạo KVS Client
  console.log('|-> Khởi tạo KVS Client ...')
  const kinesisvideoClient = KinesisVideoHelper.createNewKinesisVideo();

  // Lấy Signaling Channel ARN
  console.log('|-> Lấy Signaling Channel ARN ...')
  const describeSignalingChannelResponse = await kinesisvideoClient
  .describeSignalingChannel({
    ChannelName: channelName
  })
  .promise()
  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
  console.log('[VIEWER] ChannelARN: ', channelARN)

  // Lấy Signaling channel endpoints
  console.log('|-> Lấy Signaling channel endpoints')
  const getSignalingChannelEndpointResponse = await kinesisvideoClient
  .getSignalingChannelEndpoint({
    ChannelARN: channelARN,
    SingleMasterChannelEndpointConfiguration: {
      Protocols: ['WSS', 'HTTPS'],
      Role: VIEWER_ROLE
    }
  })
  .promise()

  // Lấy Master Endpoint
  console.log('|-> Lấy Master Endpoint')
  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
    endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
    return endpoints;
  }, {});
  console.log('[VIEWER] Endpoints: ', endpointsByProtocol);

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
  console.log('[VIEWER] ICE servers: ', iceServers);

  // Tạo Signaling Client
  console.log('Tạo Signaling Client ...')
  appStore.viewer.signalingClient = new SignalingClient({
    channelARN,
    channelEndpoint: endpointsByProtocol.WSS,
    clientId: appStore.clientId,
    role: VIEWER_ROLE,
    region: AWS_REGION,
    credentials: credentials,
    systemClockOffset: kinesisvideoClient.config.systemClockOffset,
});

  const resolution = { width: { ideal: 1280 }, height: { ideal: 720 } };
  console.log('resolution', resolution);

  const constraints = {
    video: ACCEPT_SEND_VIDEO ? resolution : false,
    audio: ACCEPT_SEND_AUDIO,
  };
  console.log('constraints', constraints);

  const configuration = {
    iceServers,
    iceTransportPolicy: STUN_TURN === STUN_ONLY ? 'relay' : 'all',
  };

  const peerConnection = new RTCPeerConnection(configuration);
  if (appStore.openDataChannel) {
    appStore.viewer.dataChannel = peerConnection.createDataChannel('kvsDataChannel');
      peerConnection.ondatachannel = event => {
          event.channel.onmessage = onRemoteDataMessage;
      };
  }

  appStore.viewer.peerConnectionStatsInterval = setInterval(() => peerConnection.getStats().then(onStatsReport), 1000);

  console.log('Thêm bắt sự kiện signalingClient.on ...')
  appStore.viewer.signalingClient.on('open', async () => {
    console.log('[VIEWER] Kết nối tới signaling service');

    if (ACCEPT_SEND_VIDEO || ACCEPT_SEND_AUDIO) {
      try {
        appStore.viewer.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        appStore.viewer.localStream.getTracks().forEach(track => peerConnection.addTrack(track, appStore.viewer.localStream));
        localView.current.srcObject = appStore.viewer.localStream;
      } catch (e) {
          console.log('ERRORS: ', e)
          console.error(VIEWER_COULD_NOT_FIND_CAMERA);
          return;
      }
    } 

    // Tạo SDP offer gửi tới master
    console.log('[VIEWER] Tạo SDP offer');
    await peerConnection.setLocalDescription(
        await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        }),
    );

    if (appStore.useTrickleICE) {
      console.log('[VIEWER] Gửi SDP offer');
      appStore.viewer.signalingClient.sendSdpOffer(peerConnection.localDescription);
    }
    console.log('[VIEWER] Generating ICE candidates');
  });

  appStore.viewer.signalingClient.on('sdpAnswer', async answer => {
    // Add the SDP answer to the peer connection
    console.log('[VIEWER] Received SDP answer');
    await peerConnection.setRemoteDescription(answer);
  });

  appStore.viewer.signalingClient.on('iceCandidate', candidate => {
    // Add the ICE candidate received from the MASTER to the peer connection
    console.log('[VIEWER] Received ICE candidate');
    peerConnection.addIceCandidate(candidate);
  });

  appStore.viewer.signalingClient.on('close', () => {
    console.log('[VIEWER] Disconnected from signaling channel');
  });

  appStore.viewer.signalingClient.on('error', error => {
    console.error('[VIEWER] Signaling client error: ', error);
  });

  // Send any ICE candidates to the other peer
  peerConnection.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
        console.log('[VIEWER] Generated ICE candidate');

        // When trickle ICE is enabled, send the ICE candidates as they are generated.
        if (appStore.useTrickleICE) {
            console.log('[VIEWER] Sending ICE candidate');
            appStore.viewer.signalingClient.sendIceCandidate(candidate);
        }
    } else {
        console.log('[VIEWER] All ICE candidates have been generated');

        // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
        if (!appStore.useTrickleICE) {
            console.log('[VIEWER] Sending SDP offer');
            appStore.viewer.signalingClient.sendSdpOffer(peerConnection.localDescription);
        }
    }
  });

  // As remote tracks are received, add them to the remote view
  peerConnection.addEventListener('track', event => {
    console.log('[VIEWER] Received remote track');
    appStore.viewer.remoteStream = event.streams[0];
    remoteView.current.srcObject = appStore.viewer.remoteStream;
  });

  
  console.log('[VIEWER] Starting viewer connection');
  appStore.viewer.signalingClient.open();
}


function onStatsReport(report) {

}

function onRemoteDataMessage(data) {
  
}

export { startViewer };