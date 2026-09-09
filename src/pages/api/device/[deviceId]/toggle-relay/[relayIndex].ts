import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { toggleRelay } from '../../../../../app/services/device.service';

type ResponseData = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const file = await fs.readFile(process.cwd() + '/src/app/data/devices.json', 'utf8');
    const devices = JSON.parse(file);

    const deviceId = req.query.deviceId ?? null
    const relayIndex = req.query.relayIndex ?? null

    const device = devices.find((device: DeviceData) => device.id == deviceId)
    if (!device) {
        return res.status(404).json({ message: 'device not found' })
    }

    if (relayIndex === null || relayIndex === undefined) {
        return res.status(400).json({ message: 'relay is required' })
    }

    const relayNumber = Number(relayIndex)
    if (!Number.isInteger(relayNumber) || relayNumber < 1) {
        return res.status(400).json({ message: 'invalid relay index' })
    }

    const result = await toggleRelay(device.address, relayNumber)

    if (!result.success) {
        return res.status(400).json({ message: 'failed' })
    }

    return res.status(200).json({ message: 'ok' })

}