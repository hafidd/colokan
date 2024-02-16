import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { getDeviceStatus } from '../../app/services/device.service';

type ResponseData = {
    message: string,
    devices: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const file = await fs.readFile(process.cwd() + '/src/app/data/devices.json', 'utf8');
    let devices = JSON.parse(file);

    devices = await Promise.all(
        devices.map(async (data: DeviceData) => {
            try {
                const status = await getDeviceStatus(data.address);

                if (!status.success) {
                    return { ...data, error: true };
                }

                let i = 1;
                status.data.forEach((status: any) => {
                    console.log("test")
                    data.relays = [...data.relays ?? [], { name: 'r' + i++, active: status == 1 }];
                });

            } catch (error) {
                return { ...data, error: true };
            }

            return data;
        })
    )

    res.status(200).json({ message: '', devices })
}