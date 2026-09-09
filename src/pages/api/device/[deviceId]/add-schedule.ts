import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { addSchedule } from '../../../../app/services/device.service';

type ResponseData = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const file = await fs.readFile(process.cwd() + '/src/app/data/devices.json', 'utf8');
    const devices = JSON.parse(file);

    const deviceId = req.query.deviceId ?? null
    const time = typeof req.query.time === 'string' ? req.query.time.trim() : null
    const relay = req.query.relay ?? null
    const status = req.query.status ?? null

    const device = devices.find((device: DeviceData) => device.id == deviceId)
    if (!device) {
        return res.status(404).json({ message: 'device not found' })
    }

    if (!time || relay === null || relay === undefined || status === null || status === undefined) {
        return res.status(400).json({ message: 'time, relay and status are required' })
    }

    const relayIndex = Number(relay)
    const statusValue = Number(status)
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time)

    if (!Number.isInteger(relayIndex) || relayIndex < 1 || !validTime || (statusValue !== 0 && statusValue !== 1)) {
        return res.status(400).json({ message: 'invalid schedule input' })
    }

    const result = await addSchedule(device.address, time, String(relayIndex), statusValue)

    if (!result.success) {
        return res.status(400).json({ message: 'failed' })
    }

    return res.status(200).json(Array.isArray(result.data) ? result.data : [])
}
