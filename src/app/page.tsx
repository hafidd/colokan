"use client"

// import { useEffect, useState } from "react"
import useSWR from 'swr'
import config from '../../next.config.mjs'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Home() {
  const { basePath } = config
  // const [data, setData] = useState({ message: '', devices: [] });
  // const [x, setX] = useState({ x: 'a', xf: true });

  const { data, error, mutate } = useSWR(`${basePath}/api/devices`, fetcher)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  // if (error) return <div>Failed to load</div>
  // if (!data) return <div>Loading...</div>

  // useEffect(() => {
  //   fetch('/api/devices')
  //     .then(res => res.json())
  //     .then(res => setData(res))
  // }, [])

  // const toggleRelay = (deviceId: string, relayName: string) => {
  //   setData((prev: any) => {

  //     return {
  //       ...prev,
  //       devices: prev.devices?.map((d: DeviceData) => {
  //         if (deviceId == d.id) {
  //           d.relays = d.relays?.map(relay => {
  //             if (relayName == relay.name) {
  //               relay.active = !relay.active
  //             }
  //             return relay
  //           })
  //         }
  //         return d
  //       })
  //     }
  //   })
  // }

  const toggleRelay = async (deviceId: string, relayIndex: number, relayName: string) => {
    try {
      const res = await fetch(`${basePath}/api/device/${deviceId}/toggle-relay/${relayIndex + 1}`)
      const { message } = await res.json()

      if (message !== 'ok') throw new Error(message)

      mutate({
        ...data,
        devices: data.devices.map((device: DeviceData) => {
          return {
            ...device,
            relays: device.relays?.map((relay: any) => {
              if (device.id === deviceId && relay.name === relayName) {
                console.log('change relay status', relayName, deviceId)
                return { ...relay, active: !relay.active }
              }
              return relay
            })
          }
        })
      }, false)
    } catch (error) {
      console.log(error)
    }

  }

  return (
    <div className="m-10">
      {data.devices?.map((device: DeviceData) =>
        <div className="border p-2 mb-4" key={device.id}>
          <span>{device.name}</span> <button>🔄</button>
          <div className="mt-1">
            {device.error ? <span className="text-red-500">Can't connect</span> : ''}
            {device.relays?.map((relay: any, idx: number) =>
              <button
                key={relay.name + device.id}
                className="border p-1 py-0 mr-1 mb-2 w-full md:w-fit text-left md:text-center"
                onClick={async () => toggleRelay(device.id, idx, relay.name)}
              >
                {relay.name || 'Switch 1'}{' '}
                {relay.active ? <span className="text-green-500">ON</span> : <span className="text-red-500">OFF</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
