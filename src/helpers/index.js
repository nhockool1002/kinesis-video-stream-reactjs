import AWS, { KinesisVideo } from 'aws-sdk'
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_KEY,
  AWS_REGION
} from '../constant/setup'
/**
 * @description Create credentials object
 */
export const credentials = () => {
  return new AWS.Credentials({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_KEY,
    region: AWS_REGION
  })
}

/**
 * @description create new kinesis video instance
 * @return KinesisVideo Instance
 */
export const createNewKinesisVideo = () => {
  return new KinesisVideo({
    region: AWS_REGION,
    credentials: credentials(),
    endpoint: null
  })
}

export const describeSignalingChannel = (channelName) => {
  const kinesisvideoClient = createNewKinesisVideo()
  return kinesisvideoClient
    .describeSignalingChannel({
      ChannelName: channelName
    })
    .promise()
}

/**
 * @description Delete SignalChannel by channelName
 * @param string channelName
 * @return void
 */
export const deleteSignalChannel = async (channelName) => {
  const kinesisVideoClient = createNewKinesisVideo()

  // Get signaling channel ARN
  const describeSignalingChannelResponse = await kinesisVideoClient
    .describeSignalingChannel({
      ChannelName: channelName
    })
    .promise()
  // Get signaling channel ARN
  await kinesisVideoClient
    .deleteSignalingChannel({
      ChannelARN: describeSignalingChannelResponse.ChannelInfo.ChannelARN,
      CurrentVersion:
        describeSignalingChannelResponse.ChannelInfo.CurrentVersion
    })
    .promise()
  console.log(
    '[DELETE_SIGNALING_CHANNEL] Channel ARN: ',
    describeSignalingChannelResponse.ChannelInfo.ChannelARN
  )
}

/**
 * @description Create Signal Channel by channelName
 * @param string channelName
 * @return void
 */
export const createSignalChannel = async (channelName) => {
  const kinesisVideoClient = createNewKinesisVideo()

  // Get signaling channel ARN
  await kinesisVideoClient
    .createSignalingChannel({
      ChannelName: channelName
    })
    .promise()

  // Get signaling channel ARN
  const describeSignalingChannelResponse = await kinesisVideoClient
    .describeSignalingChannel({
      ChannelName: channelName
    })
    .promise()
  const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN
  console.log('[CREATE_SIGNALING_CHANNEL] Channel ARN: ', channelARN)
}

/**
 * @description Show List Signal Channel
 * @return Collection ListDta
 */
export const showSignalChannel = async () => {
  const kinesisVideoClient = createNewKinesisVideo()

  const ListDta = await kinesisVideoClient.listSignalingChannels().promise()
  console.log('[LIST_SIGNALING_CHANNEL] Channel ARN: ', ListDta.ChannelInfoList)
}
