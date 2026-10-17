import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Texture } from 'three'
import { expect, it } from 'vitest'

import { disposeModel } from './disposeModel'

it('закрывает bitmap, общий для нескольких текстур модели', async () => {
  const bitmap = await createImageBitmap(new ImageData(2, 2))
  const firstTexture = new Texture(bitmap)
  const secondTexture = new Texture(bitmap)
  const geometry = new BoxGeometry()
  const material = new MeshBasicMaterial({ alphaMap: secondTexture, map: firstTexture })
  const model = new Group()
  model.add(new Mesh(geometry, material))

  try {
    expect(bitmap.width).toBe(2)

    disposeModel(model)

    expect(bitmap.width).toBe(0)
    expect(bitmap.height).toBe(0)
  } finally {
    bitmap.close()
    geometry.dispose()
    material.dispose()
    firstTexture.dispose()
    secondTexture.dispose()
  }
})
