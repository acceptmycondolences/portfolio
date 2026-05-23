import type { Object3D, Scene } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface ModelOptions {
  castShadow: boolean
  receiveShadow: boolean
}

const dracoLoader = new DRACOLoader()

dracoLoader.setDecoderConfig({ type: 'js' })
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

const MODEL_URL = `${import.meta.env.BASE_URL}3D-models/voxel-dog.glb`

export function loadGLTFModel(
  scene: Scene,
  options: ModelOptions = { castShadow: true, receiveShadow: true },
): Promise<Object3D> {
  const { castShadow, receiveShadow } = options

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.setDRACOLoader(dracoLoader)

    loader.load(
      MODEL_URL,
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
        reject(
          error instanceof Error ? error : new Error('Failed to load the voxel model of the dog.', { cause: error }),
        )
      },
    )
  })
}
