import type { Scene } from 'three'
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js'

const draco = new DRACOLoader()

draco.setDecoderConfig({ type: 'js' })

draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

export const loadGLTFModel = (scene: Scene, options = { castShadow: true, receiveShadow: true }) => {
  const { castShadow, receiveShadow } = options

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.setDRACOLoader(draco)

    loader.load(
      '/3d-model/voxel-dog.glb',
      (data) => {
        const object = data.scene

        object.name = 'voxel-dog'

        object.position.y = 0
        object.position.x = 0

        object.castShadow = castShadow
        object.receiveShadow = receiveShadow

        scene.add(object)

        object.traverse((child) => {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
        })

        resolve(object)
      },
      undefined,
      (error) => {
        if (error instanceof Error) {
          reject(error)
        }
      },
    )
  })
}

export const easeOutCircular = (x: number) => {
  return Math.sqrt(1 - Math.pow(x - 1, 4))
}
