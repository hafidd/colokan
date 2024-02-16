import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { getDeviceStatus } from '../../../../app/services/device.service';

type ResponseData = {
    message: string,
    device?: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const file = await fs.readFile(process.cwd() + '/src/app/data/devices.json', 'utf8');
    let devices = JSON.parse(file);

    const deviceId = req.query.deviceId ?? null
    console.log(deviceId)

    const device = devices.find((device: DeviceData) => device.id == deviceId)
    if (!device) {
        res.status(404).json({ message: 'device not found', device: null })
    }

    const status = await getDeviceStatus(device.address);

    let i = 1;
    status.data.forEach((status: any) => {
        device.relays = [...device.relays ?? [], { name: 'r' + i++, active: status == 1 }];
    });

    res.status(200).json({ message: '', device })
}