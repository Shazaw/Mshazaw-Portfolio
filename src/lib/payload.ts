import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Single Payload instance shared by every server render and route handler. */
export const getPayloadClient = async () => getPayload({ config })
