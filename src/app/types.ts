type DeviceData = {
    id: string,
    name: string,
    address: string,
    scheduleByDay?: boolean,
    relays?: Array<any>,
    schedules?: Array<any>,
    error: boolean
}