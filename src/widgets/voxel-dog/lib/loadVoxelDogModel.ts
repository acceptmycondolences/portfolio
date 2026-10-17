import type { Object3D, Scene } from 'three'
import { DRACO_GLTF_CONFIG, DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const dracoLoader = new DRACOLoader()

dracoLoader.setDecoderPath(DRACO_GLTF_CONFIG)

const MODEL_URL = `${import.meta.env.BASE_URL}3d-models/voxel-dog.glb`

export function loadVoxelDogModel(scene: Scene): Promise<Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()

    loader.setDRACOLoader(dracoLoader)

    loader.load(
      MODEL_URL,
      (data) => {
        const object = data.scene

        object.name = 'voxel-dog'

        object.castShadow = false
        object.receiveShadow = false

        scene.add(object)

        object.traverse((child) => {
          child.castShadow = false
          child.receiveShadow = false
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
