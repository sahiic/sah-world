export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
} as const

export const ISTANBUL_QIBLA_BEARING = 151

export function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

export function calculateQiblaBearing(latitude: number, longitude: number) {
  const sourceLatitude = toRadians(latitude)
  const targetLatitude = toRadians(KAABA_COORDINATES.latitude)
  const longitudeDelta = toRadians(KAABA_COORDINATES.longitude - longitude)

  const y = Math.sin(longitudeDelta) * Math.cos(targetLatitude)
  const x =
    Math.cos(sourceLatitude) * Math.sin(targetLatitude) -
    Math.sin(sourceLatitude) * Math.cos(targetLatitude) * Math.cos(longitudeDelta)

  return normalizeDegrees(toDegrees(Math.atan2(y, x)))
}

export function relativeQiblaBearing(qiblaBearing: number, screenHeading: number) {
  return normalizeDegrees(qiblaBearing - screenHeading)
}

export function cardioidRotation(relativeBearing: number) {
  // The generated cardioid's pointed front is 90 degrees behind the SVG x-axis.
  return normalizeDegrees(relativeBearing + 90)
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI
}
