import { Group, Scene, type Object3D } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { loadVoxelDogModel } from './loadVoxelDogModel'

const { load, setDecoderPath, setDRACOLoader } = vi.hoisted(() => ({
  load: vi.fn<
    (
      url: string,
      onLoad: (data: { scene: Object3D }) => void,
      onProgress?: undefined,
      onError?: (error: unknown) => void,
    ) => void
  >(),
  setDecoderPath: vi.fn(),
  setDRACOLoader: vi.fn(),
}))

vi.mock(import('three/examples/jsm/loaders/DRACOLoader.js'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    DRACOLoader: class extends actual.DRACOLoader {
      override setDecoderPath = setDecoderPath
    },
  }
})

vi.mock(import('three/examples/jsm/loaders/GLTFLoader.js'), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    GLTFLoader: class extends actual.GLTFLoader {
      override load = load
      override setDRACOLoader = setDRACOLoader
    },
  }
})

describe('loadVoxelDogModel', () => {
  it('добавляет модель в сцену и отключает тени во всей иерархии', async () => {
    const scene = new Scene()
    const model = new Group()
    const child = new Group()
    model.add(child)
    for (const object of [model, child]) {
      object.castShadow = true
      object.receiveShadow = true
    }
    load.mockImplementation((_url, onLoad) => {
      onLoad({ scene: model })
    })

    await expect(loadVoxelDogModel(scene)).resolves.toBe(model)

    expect(model.name).toBe('voxel-dog')
    expect(scene.children).toContain(model)
    expect([model, child].every((object) => !object.castShadow && !object.receiveShadow)).toBe(true)
    expect(setDRACOLoader).toHaveBeenCalledOnce()
    expect(load.mock.calls[0]?.[0]).toMatch(/3d-models\/voxel-dog\.glb$/)
  })

  it('возвращает исходную ошибку загрузки', async () => {
    const failure = new Error('network failure')
    load.mockImplementation((_url, _onLoad, _progress, onError) => {
      onError?.(failure)
    })

    await expect(loadVoxelDogModel(new Scene())).rejects.toBe(failure)
  })

  it('оборачивает ошибку другого типа и сохраняет причину', async () => {
    const failure = { status: 503 }
    load.mockImplementation((_url, _onLoad, _progress, onError) => {
      onError?.(failure)
    })

    await expect(loadVoxelDogModel(new Scene())).rejects.toMatchObject({
      cause: failure,
      message: 'Failed to load the voxel model of the dog.',
    })
  })
})
