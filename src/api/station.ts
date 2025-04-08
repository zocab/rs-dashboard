// src/api/station.ts
import type { Station } from '../types'

export async function fetchStations(query: string): Promise<Station[]> {
  // For demonstration, load the sample data from the public folder.
  const response = await fetch('/data/stations.json')
  if (!response.ok) {
    throw new Error('Failed to load station data')
  }
  const stations: Station[] = await response.json()
  return stations.filter((station) => station.name.toLowerCase().includes(query.toLowerCase()))
}
