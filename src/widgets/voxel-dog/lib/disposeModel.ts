import { Mesh, Texture, type Material, type Object3D } from 'three'

export function disposeModel(model: Object3D) {
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const bitmaps = new Set<ImageBitmap>()

  model.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return
    }

    const mesh = child as unknown as Mesh

    mesh.geometry.dispose()

    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material)

      for (const value of Object.values(material) as unknown[]) {
        if (isTexture(value)) {
          textures.add(value)
        }
      }
    }
  })

  for (const material of materials) {
    material.dispose()
  }

  for (const texture of textures) {
    texture.dispose()

    const image: unknown = texture.source.data

    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      bitmaps.add(image)
    }
  }

  for (const bitmap of bitmaps) {
    bitmap.close()
  }

  model.removeFromParent()
}

function isTexture(value: unknown): value is Texture {
  return value instanceof Texture
}
