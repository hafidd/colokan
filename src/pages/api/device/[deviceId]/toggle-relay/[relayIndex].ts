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
    let devices = JSON.parse(file);

    const deviceId = req.query.deviceId ?? null
    const relayIndex = req.query.relayIndex ?? null

    const device = devices.find((device: DeviceData) => device.id == deviceId)
    if (!device) {
        res.status(404).json({ message: 'device not found' })
    }

    try {
        await toggleRelay(device.address, relayIndex);
        res.status(200).json({ message: 'ok' })
    } catch {
        res.status(400).json({ message: 'failed' })
    }

}