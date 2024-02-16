import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs';
import { getDeviceStatus } from '../../../app/services/device.service';

type ResponseData = any

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const id = req.query.id ?? null

    res.status(200).json({ message: '', id })
}