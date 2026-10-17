import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene, Texture } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { disposeModel } from './disposeModel'

describe('disposeModel', () => {
  it('освобождает ресурсы мешей без повторного удаления общих материалов и текстур', () => {
    const scene = new Scene()
    const model = new Group()
    const geometry = new BoxGeometry()
    const texture = new Texture()
    const material = new MeshBasicMaterial({ map: texture })
    const disposeGeometry = vi.spyOn(geometry, 'dispose')
    const disposeMaterial = vi.spyOn(material, 'dispose')
    const disposeTexture = vi.spyOn(texture, 'dispose')

    model.add(new Mesh(geometry, material), new Mesh(geometry, [material, material]))
    scene.add(model)

    disposeModel(model)

    expect(disposeGeometry).toHaveBeenCalledTimes(2)
    expect(disposeMaterial).toHaveBeenCalledOnce()
    expect(disposeTexture).toHaveBeenCalledOnce()
    expect(model.parent).toBeNull()
  })

  it('удаляет пустую модель из сцены', () => {
    const scene = new Scene()
    const model = new Group()
    scene.add(model)

    disposeModel(model)

    expect(scene.children).toHaveLength(0)
  })
})
