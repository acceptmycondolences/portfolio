import { useEffect, useRef, useState } from 'react'

import { AmbientLight, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer, type Object3D } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { disposeModel, easeOutCircular, loadGLTFModel } from '~/widgets/voxel-dog'

import { IconLoader } from '~/shared/ui'

const MAX_PIXEL_RATIO = 2
const INTRO_DURATION_MS = 1600

export function VoxelDog() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const { current: container } = containerRef

    if (!container) {
      return
    }

    let model: Object3D | undefined
    let isDisposed = false
    let animationFrameId: number | undefined
    let introStartTime: number | undefined

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 50000)

    const initialCameraPosition = new Vector3(20 * Math.sin(0.2 * Math.PI), 10, 20 * Math.cos(0.2 * Math.PI))
    const cameraTarget = new Vector3(-0.5, 1.2, 0)

    camera.position.copy(initialCameraPosition)
    camera.lookAt(cameraTarget)

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    })

    renderer.outputColorSpace = SRGBColorSpace

    renderer.domElement.setAttribute('aria-hidden', 'true')

    container.appendChild(renderer.domElement)

    const orbitControls = new OrbitControls(camera, renderer.domElement)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    orbitControls.autoRotate = !prefersReducedMotion
    orbitControls.maxZoom = 1

    orbitControls.target.copy(cameraTarget)

    const scene = new Scene()

    scene.add(new AmbientLight(0xcccccc, Math.PI))

    const renderScene = () => {
      renderer.render(scene, camera)
    }

    const resizeScene = () => {
      const { clientHeight: height, clientWidth: width } = container

      const cameraViewSize = height * 0.005 + 4.8

      camera.top = cameraViewSize
      camera.right = cameraViewSize
      camera.bottom = -cameraViewSize
      camera.left = -cameraViewSize

      camera.updateProjectionMatrix()

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
      renderer.setSize(width, height)

      if (model && prefersReducedMotion) {
        renderScene()
      }
    }

    const resizeObserver = new ResizeObserver(resizeScene)

    resizeObserver.observe(container)

    resizeScene()

    if (prefersReducedMotion) {
      orbitControls.addEventListener('change', renderScene)
    }

    const animateScene = (time: number) => {
      if (isDisposed) {
        return
      }

      animationFrameId = requestAnimationFrame(animateScene)

      introStartTime ??= time

      const progress = Math.min((time - introStartTime) / INTRO_DURATION_MS, 1)

      if (progress < 1) {
        const rotationAngle = -easeOutCircular(progress) * Math.PI * 20

        camera.position.x =
          initialCameraPosition.x * Math.cos(rotationAngle) + initialCameraPosition.z * Math.sin(rotationAngle)
        camera.position.z =
          initialCameraPosition.z * Math.cos(rotationAngle) - initialCameraPosition.x * Math.sin(rotationAngle)

        camera.lookAt(cameraTarget)
      } else {
        orbitControls.update()
      }

      renderScene()
    }

    void loadGLTFModel(scene, {
      castShadow: false,
      receiveShadow: false,
    }).then(
      (loadedModel) => {
        if (isDisposed) {
          disposeModel(loadedModel)

          return
        }

        model = loadedModel

        setIsLoading(false)

        if (prefersReducedMotion) {
          renderScene()

          return
        }

        animationFrameId = requestAnimationFrame(animateScene)
      },
      (error: unknown) => {
        if (!isDisposed) {
          console.error('VoxelDog could not be initialized.', error)

          setHasError(true)
          setIsLoading(false)
        }
      },
    )

    return () => {
      isDisposed = true

      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
      }

      resizeObserver.disconnect()

      if (prefersReducedMotion) {
        orbitControls.removeEventListener('change', renderScene)
      }

      orbitControls.dispose()

      if (model) {
        disposeModel(model)
      }

      renderer.domElement.remove()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [])

  return (
    <div
      className="relative mx-auto -mt-17.5 -mb-22.5 flex size-72 items-center justify-center md:-mt-25.5 md:-mb-33.5 md:size-128 [&_svg]:pointer-events-none [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:left-1/2 [&_svg]:shrink-0 [&_svg]:-translate-1/2 [&_svg]:animate-spin"
      ref={containerRef}
    >
      {isLoading && <IconLoader />}
      {hasError && (
        <p className="absolute inset-0 flex items-center justify-center text-center text-sm">
          The 3D model is unavailable.
        </p>
      )}
    </div>
  )
}
