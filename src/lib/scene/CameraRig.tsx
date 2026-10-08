import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { useJourneyStore } from '../store'
import { pointAt } from '../path'

const OFFSET = new Vector3(17, 15, 21)

/** Low three-quarter perspective camera that gently follows the selected vehicle. */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const store = useJourneyStore()
  const aspect = useThree((s) => s.viewport.aspect)
  const target = useMemo(() => new Vector3(), [])
  const want = useMemo(() => new Vector3(), [])
  const dir = useMemo(() => new Vector3(), [])
  const off = useMemo(() => new Vector3(), [])

  useFrame(({ camera }, dt) => {
    const st = store.getState()
    const m = st.motion(st.activeId)
    const { pos } = pointAt(st.route, m.s, want, dir)
    want.copy(pos).multiplyScalar(0.45)
    want.y = 0
    target.lerp(want, reducedMotion ? 1 : 1 - Math.exp(-2.2 * dt))
    off.copy(OFFSET).setLength(aspect < 1 ? 40 : 31)
    camera.position.copy(target).add(off)
    camera.lookAt(target)
  })

  return <PerspectiveCamera makeDefault fov={aspect < 1 ? 46 : 34} near={0.1} far={200} position={[17, 15, 21]} />
}
