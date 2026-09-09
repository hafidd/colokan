"use client"

// import { useEffect, useState } from "react"
import useSWR from 'swr'
import config from '../../next.config.mjs'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Home() {
  const { basePath } = config
  // const [data, setData] = useState({ message: '', devices: [] });
  // const [x, setX] = useState({ x: 'a', xf: true });

  const [scheduleSelected, setScheduleSelected] = useState<any | null>(null)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [addScheduleDeviceId, setAddScheduleDeviceId] = useState<string | null>(null)
  const [addScheduleError, setAddScheduleError] = useState<string | null>(null)
  const [addScheduleLoading, setAddScheduleLoading] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    time: '06:00',
    relayIndex: 1,
    status: true,
    days: {
      Sun: false,
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: false,
    }
  })

  const { data, error, mutate, isLoading } = useSWR(`${basePath}/api/devices`, fetcher)

  if (error) return <div>Failed to load</div>
  if (isLoading || !data) return <div>Loading...</div>

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
    if (toggleLoading || isLoading || !data) return

    const key = `${deviceId}-${relayName}`
    setToggleLoading(key)

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
    } finally {
      setToggleLoading(null)
    }

  }

  const deleteSchedule = async () => {
    if (!scheduleSelected || !data || deleteLoading) return

    const selectedDevice = data.devices.find((device: DeviceData) =>
      device.schedules?.some((schedule: any) => {
        const sameId = schedule.id && scheduleSelected.id && schedule.id === scheduleSelected.id
        const sameTime = schedule.time === scheduleSelected.time
        const sameRelay = (schedule.relayIndex ?? schedule.relay ?? 1) === (scheduleSelected.relayIndex ?? scheduleSelected.relay ?? 1)
        return sameId || (sameTime && sameRelay)
      })
    )

    if (!selectedDevice) return

    const time = scheduleSelected.time
    const relayIndex = scheduleSelected.relayIndex ?? scheduleSelected.relay ?? 1

    setDeleteLoading(true)

    try {
      const res = await fetch(`${basePath}/api/device/${selectedDevice.id}/remove-schedule?time=${encodeURIComponent(time)}&relay=${relayIndex}`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error((result && result.message) || 'Failed to delete schedule')
      }

      if (!Array.isArray(result)) {
        throw new Error('Invalid schedule response')
      }

      await mutate()
      setToastMessage('Schedule removed')
      setScheduleSelected(null)
      setConfirmDelete(false)

      setTimeout(() => setToastMessage(null), 2000)
    } catch (error) {
      console.log(error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openAddScheduleModal = (deviceId: string) => {
    const device = data?.devices?.find((item: DeviceData) => item.id === deviceId)
    if (!device) return

    setAddScheduleDeviceId(deviceId)
    setNewSchedule({
      time: '06:00',
      relayIndex: device.relays?.length ? 1 : 0,
      status: true,
      days: {
        Sun: false,
        Mon: false,
        Tue: false,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
      }
    })
  }

  const closeAddScheduleModal = () => {
    setAddScheduleDeviceId(null)
  }

  const saveNewSchedule = async () => {
    if (!addScheduleDeviceId || !data || addScheduleLoading) return

    const device = data.devices.find((item: DeviceData) => item.id === addScheduleDeviceId)
    if (!device) return

    if (device.error) {
      setAddScheduleError('This device is offline and cannot receive a new schedule.')
      return
    }

    if (!newSchedule.time) {
      setAddScheduleError('Please choose a time.')
      return
    }

    const scheduleTime = newSchedule.time
    const relayIndex = Number(newSchedule.relayIndex)

    if (Number.isNaN(relayIndex) || relayIndex < 0) {
      setAddScheduleError('Please choose a valid relay.')
      return
    }

    setAddScheduleLoading(true)
    setAddScheduleError(null)

    try {
      const res = await fetch(`${basePath}/api/device/${device.id}/add-schedule?time=${encodeURIComponent(scheduleTime)}&relay=${relayIndex}&status=${newSchedule.status ? 1 : 0}`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error((result && result.message) || 'Failed to add schedule')
      }

      if (!Array.isArray(result)) {
        throw new Error('Invalid schedule response')
      }

      await mutate()
      setToastMessage('Schedule added')
      closeAddScheduleModal()
      setTimeout(() => setToastMessage(null), 2000)
    } catch (error: any) {
      setAddScheduleError(error.message || 'Could not add schedule.')
    } finally {
      setAddScheduleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Control panel</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Connected devices</h1>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {data.devices?.length ?? 0} active devices
          </div>
        </header>

        <div className="space-y-6">
          {data.devices?.map((device: DeviceData) => (
            <section
              className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-6"
              key={device.id}
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${device.error ? 'bg-rose-400' : 'bg-emerald-500'}`} />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{device.name}</h2>
                    {device.error ? (
                      <p className="text-sm text-rose-600">Can’t connect to device</p>
                    ) : (
                      <p className="text-sm text-slate-500">Online and ready</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                  aria-label="Refresh device"
                >
                  ↻
                </button>
              </div>

              {device.error ? null : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {device.relays?.map((relay: any, idx: number) => (
                    <button
                      key={relay.name + device.id}
                      type="button"
                      disabled={Boolean(toggleLoading) || isLoading}
                      onClick={async () => toggleRelay(device.id, idx, relay.name)}
                      className={`group rounded-md border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                        relay.active
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500">{relay.name || `Switch ${idx + 1}`}</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {relay.active ? 'On' : 'Off'}
                          </p>
                        </div>

                        <span
                          className={`inline-flex h-3.5 w-3.5 rounded-full ${
                            relay.active ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className={device.error ? 'hidden' : 'mt-6'}>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Schedule</p>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      onClick={() => openAddScheduleModal(device.id)}
                    >
                      + Add
                    </button>
                  </div>

                  {device.schedules?.length === 0 ? (
                    <span className="text-sm text-slate-500">No schedule configured</span>
                  ) : (
                    <div className="space-y-3">
                      {device.schedules?.map((schedule: any, index: number) => (
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-100"
                          onClick={() => setScheduleSelected(schedule)}
                          key={schedule.id ?? `${device.id}-${schedule.time}-${index}`}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">{schedule.time}</p>
                            <p className="text-xs text-slate-500">Relay {schedule.relayIndex}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                schedule.status ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {schedule.status ? 'ON' : 'OFF'}
                            </span>
                            {device.scheduleByDay ? (
                              <span className="text-[10px] text-slate-400">Weekly</span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {toastMessage ? (
        <div className="fixed right-4 top-4 z-[60] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      {addScheduleDeviceId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Add schedule</h3>

            {addScheduleError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {addScheduleError}
              </div>
            ) : null}

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(event) => setNewSchedule((prev) => ({ ...prev, time: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Relay</label>
                <select
                  value={newSchedule.relayIndex}
                  onChange={(event) => setNewSchedule((prev) => ({ ...prev, relayIndex: Number(event.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                >
                  {(data?.devices?.find((item: DeviceData) => item.id === addScheduleDeviceId)?.relays ?? []).map((relay: any, idx: number) => (
                    <option key={`${relay.name ?? 'relay'}-${idx}`} value={idx}>
                      {relay.name || `Relay ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${newSchedule.status ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    onClick={() => setNewSchedule((prev) => ({ ...prev, status: true }))}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${!newSchedule.status ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    onClick={() => setNewSchedule((prev) => ({ ...prev, status: false }))}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {data?.devices?.find((item: DeviceData) => item.id === addScheduleDeviceId)?.scheduleByDay ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Days</label>
                  <div className="grid grid-cols-2 gap-2"> 
                    {Object.entries(newSchedule.days).map(([day, checked]) => (
                      <label key={day} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setNewSchedule((prev) => ({
                              ...prev,
                              days: { ...prev.days, [day]: event.target.checked }
                            }))
                          }
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={saveNewSchedule}
                disabled={addScheduleLoading}
              >
                {addScheduleLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={() => {
                  closeAddScheduleModal()
                  setAddScheduleError(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        id="modal"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 transition ${scheduleSelected ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-2xl">
          {!confirmDelete ? (
            <>
              <h3 className="text-lg font-semibold text-slate-900">Schedule details</h3>
              <p className="mt-2 text-sm text-slate-600">
                {scheduleSelected ? `${scheduleSelected.time} · Relay ${scheduleSelected.relayIndex ?? scheduleSelected.relay ?? 1}` : 'Select a schedule'}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Status: <span className={scheduleSelected?.status ? 'text-emerald-600' : 'text-rose-600'}>{scheduleSelected?.status ? 'ON' : 'OFF'}</span>
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleteLoading}
                >
                  Delete
                </button>

                <button
                  id="closeBtn"
                  type="button"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  onClick={() => {
                    setScheduleSelected(null)
                    setConfirmDelete(false)
                  }}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-900">Confirm delete</h3>
              <p className="mt-2 text-sm text-slate-600">
                Remove schedule at <strong>{scheduleSelected?.time}</strong> for relay <strong>{scheduleSelected?.relayIndex ?? scheduleSelected?.relay ?? 1}</strong>?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={deleteSchedule}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, delete'}
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
