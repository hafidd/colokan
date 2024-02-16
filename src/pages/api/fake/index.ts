import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { getDeviceStatus } from '../../../app/services/device.service';

type ResponseData = any

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const data = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
    ]
    res.status(200).json({ message: '', data })
}