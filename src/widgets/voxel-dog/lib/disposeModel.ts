import { Mesh, Texture, type Material, type Object3D } from 'three'

export function disposeModel(model: Object3D) {
  const materials = new Set<Material>()
  const textures = new Set<Texture>()

  model.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return
    }

    const mesh = child as unknown as Mesh

    mesh.geometry.dispose()

    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material)

      for (const value of Object.values(material)) {
        if (value instanceof Texture) {
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
  }

  model.removeFromParent()
}
