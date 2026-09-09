import axios from 'axios';

export async function getDeviceStatus(deviceAddress: string): Promise<any> {
    try {
        const { data } = await axios.get(deviceAddress, { timeout: 500 })

        return {
            success: true,
            data: data.split('Relay Status: ')[1].split('<br>')[0].split(',')
        }
    } catch (error) {
        // console.log(error)
        console.log('error getting status: ' + deviceAddress)

        return {
            success: false,
            data: []
        }
    }
}

export async function getDeviceSchedules(deviceAddress: string): Promise<any> {
    try {
        console.log('getting schedulesxx: ' + deviceAddress)
        const { data } = await axios.get(deviceAddress + '/get-schedules', { timeout: 500 })


        return {
            success: true,
            data: data.filter((schedule: any) => schedule.time != '')
        }
    } catch (error) {
        // console.log(error)
        console.log('error getting schedules: ' + deviceAddress)

        return {
            success: false,
            data: []
        }
    }
}

export async function toggleRelay(deviceAddress: string, relayIndex: number | string): Promise<any> {
    try {
        const { data } = await axios.get(`${deviceAddress}/toggle-relay?n=${relayIndex}`, { timeout: 500 })

        if (data != 'ok') throw new Error("toggle relay failed")

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

export async function removeSchedule(deviceAddress: string, time: string, relayIndex: number | string): Promise<any> {
    try {
        const params = new URLSearchParams({
            time,
            relay: String(relayIndex)
        })

        const { data } = await axios.get(`${deviceAddress}/remove-schedule?${params.toString()}`, { timeout: 10000 })

        if (Array.isArray(data)) {
            return {
                success: true,
                data
            }
        }

        if (data === 'ok') {
            return {
                success: true,
                data: []
            }
        }

        throw new Error('remove schedule failed')
    } catch (error) {
        console.log('error removing schedule: ' + deviceAddress)

        return {
            success: false,
            data: []
        }
    }
}

export async function addSchedule(deviceAddress: string, time: string, relayIndex: number | string, status: number | boolean): Promise<any> {
    try {
        const params = new URLSearchParams({
            time,
            relay: String(relayIndex),
            status: String(Number(status))
        })

        const { data } = await axios.get(`${deviceAddress}/add-schedule?${params.toString()}`, { timeout: 10000 })

        if (Array.isArray(data)) {
            return {
                success: true,
                data
            }
        }

        if (data === 'ok') {
            return {
                success: true,
                data: []
            }
        }

        throw new Error('add schedule failed')
    } catch (error) {
        console.log('error adding schedule: ' + deviceAddress)

        return {
            success: false,
            data: []
        }
    }
}

