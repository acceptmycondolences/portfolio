import { useCallback, useEffect, useRef, useState } from 'react'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

import { easeOutCircular, loadGLTFModel } from '~/widgets/voxel-dog'

import { IconLoader } from '~/shared/ui'

export function VoxelDog() {
  const [isLoading, setIsLoading] = useState(true)

  const rendererRef = useRef<null | THREE.WebGLRenderer>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleResize = useCallback(() => {
    const { current: renderer } = rendererRef
    const { current: container } = containerRef

    if (renderer && container) {
      const width = container.clientWidth
      const height = container.clientHeight

      renderer.setSize(width, height)
    }
  }, [])

  useEffect(() => {
    const { current: container } = containerRef

    if (container) {
      const width = container.clientWidth
      const height = container.clientHeight

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      })

      renderer.outputColorSpace = THREE.SRGBColorSpace

      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(width, height)

      container.appendChild(renderer.domElement)

      rendererRef.current = renderer

      const cameraViewSize = height * 0.005 + 4.8

      const camera = new THREE.OrthographicCamera(
        -cameraViewSize,
        cameraViewSize,
        cameraViewSize,
        -cameraViewSize,
        0.01,
        50000,
      )

      const cameraTarget = new THREE.Vector3(-0.5, 1.2, 0)
      const initialCameraPosition = new THREE.Vector3(20 * Math.sin(0.2 * Math.PI), 10, 20 * Math.cos(0.2 * Math.PI))

      camera.lookAt(cameraTarget)
      camera.position.copy(initialCameraPosition)

      const scene = new THREE.Scene()

      const ambientLight = new THREE.AmbientLight(0xcccccc, Math.PI)

      scene.add(ambientLight)

      const orbitControls = new OrbitControls(camera, renderer.domElement)

      orbitControls.autoRotate = true
      orbitControls.maxZoom = 1
      orbitControls.target = cameraTarget

      let animationFrameId: number
      let animationFrame = 0

      const animateScene = () => {
        animationFrameId = requestAnimationFrame(animateScene)

        animationFrame = animationFrame <= 100 ? animationFrame + 1 : animationFrame

        if (animationFrame <= 100) {
          const startPosition = initialCameraPosition

          const rotationAngle = -easeOutCircular(animationFrame / 120) * Math.PI * 20

          camera.position.y = 10
          camera.position.x = startPosition.x * Math.cos(rotationAngle) + startPosition.z * Math.sin(rotationAngle)
          camera.position.z = startPosition.z * Math.cos(rotationAngle) - startPosition.x * Math.sin(rotationAngle)

          camera.lookAt(cameraTarget)
        } else {
          orbitControls.update()
        }

        renderer.render(scene, camera)
      }

      void loadGLTFModel(scene, {
        castShadow: false,
        receiveShadow: false,
      }).then(() => {
        animateScene()

        setIsLoading(false)
      })

      return () => {
        cancelAnimationFrame(animationFrameId)

        renderer.domElement.remove()
        renderer.dispose()
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return (
    <div
      className="relative mx-auto -mt-17.5 -mb-22.5 flex size-72 items-center justify-center md:-mt-25.5 md:-mb-33.5 md:size-128 [&_svg]:pointer-events-none [&_svg]:absolute [&_svg]:top-0 [&_svg]:left-0 [&_svg]:shrink-0 [&_svg]:-translate-1/2 [&_svg]:animate-spin"
      ref={containerRef}
    >
      {isLoading && <IconLoader />}
    </div>
  )
}
