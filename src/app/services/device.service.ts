import axios from 'axios';

export async function getDeviceStatus(deviceAddress: string): Promise<any> {
    try {
        const { data } = await axios.get(deviceAddress, { timeout: 1000 })

        return {
            success: true,
            data: data.split('Relay Status: ')[1].split('<br>')[0].split(',')
        }
    } catch (error) {
        // console.log(error)
        console.log('error: ' + deviceAddress)

        return {
            success: false,
            data: []
        }
    }
}

export async function toggleRelay(deviceAddress: string, relayIndex: any): Promise<any> {
    try {
        const { data } = await axios.get(`${deviceAddress}/toggle-relay?n=${relayIndex}`)

        if (data != 'ok') throw new Error("err")

        return {
            success: true,
            data: null
        }
    } catch {
        return {
            success: false,
            data: []
        }
    }
}