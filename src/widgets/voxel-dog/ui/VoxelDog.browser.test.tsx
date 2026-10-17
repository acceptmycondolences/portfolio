import { StrictMode } from 'react'

import { BoxGeometry, Camera, Group, Mesh, MeshBasicMaterial, Vector3, type Object3D } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { it as baseIt, describe, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { VoxelDog } from './VoxelDog'

const { load } = vi.hoisted(() => ({
  load: vi.fn<
    (
      url: string,
      onLoad: (data: { scene: Object3D }) => void,
      onProgress?: undefined,
      onError?: (error: unknown) => void,
    ) => void
  >(),
}))

vi.mock(import('three/examples/jsm/loaders/GLTFLoader.js'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    GLTFLoader: class extends actual.GLTFLoader {
      override load = load
    },
  }
})

const it = baseIt.extend<{
  frames: { callbacks: FrameRequestCallback[]; cancel: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> }
  model: Group
}>({
  frames: async ({ task }, provide) => {
    const callbacks: FrameRequestCallback[] = []
    const request = vi.fn((callback: FrameRequestCallback) => callbacks.push(callback)).mockName(task.name)
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', request)
    vi.stubGlobal('cancelAnimationFrame', cancel)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    await provide({ callbacks, cancel, request })
  },
  model: async ({ task }, provide) => {
    const model = new Group()
    model.name = task.name
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial()
    model.add(new Mesh(geometry, material))
    try {
      await provide(model)
    } finally {
      geometry.dispose()
      material.dispose()
    }
  },
})

describe('VoxelDog', () => {
  it('показывает fallback без загрузки модели, если WebGL недоступен', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const screen = await render(<VoxelDog />)

    await expect.element(screen.getByRole('alert')).toHaveTextContent('The 3D model is unavailable.')
    await expect.element(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'false')
    await expect.element(screen.getByRole('status')).not.toBeInTheDocument()
    await expect.element(screen.getByText('The 3D model is unavailable.')).toBeVisible()
    await expect.element(screen.container.querySelector('svg')).not.toBeInTheDocument()
    await expect.element(screen.container.querySelector('canvas')).not.toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
  })

  it('не переносит ошибку WebGL из предыдущего эффекта при повторной инициализации в StrictMode', async ({ model }) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(null).mockReturnValueOnce(null)

    const screen = await render(
      <StrictMode>
        <VoxelDog />
      </StrictMode>,
    )
    expect(load).toHaveBeenCalledOnce()
    load.mock.calls[0][1]({ scene: model })

    await expect.element(screen.container.querySelector('svg')).not.toBeInTheDocument()
    await expect.element(screen.container.querySelector('canvas')).toBeInTheDocument()
    await expect.element(screen.getByText('The 3D model is unavailable.')).not.toBeInTheDocument()
  })

  it.for([30, 120])('вращается на одинаковый угол за секунду при %i FPS', async (fps, { frames, model }) => {
    const updateControls = vi.spyOn(OrbitControls.prototype, 'update')
    const screen = await render(<VoxelDog />)
    load.mock.calls[0][1]({ scene: model })
    await expect.element(screen.container.querySelector('svg')).not.toBeInTheDocument()

    frames.callbacks[0](0)
    frames.callbacks[1](1600)
    const controls: unknown = updateControls.mock.contexts[0]
    if (!(controls instanceof OrbitControls)) throw new Error('Управление камерой не создано')
    const camera: unknown = controls.object
    if (!(camera instanceof Camera)) throw new Error('Камера не создана')
    const target = new Vector3(-0.5, 1.2, 0)
    const start = camera.position.clone().sub(target)

    for (let frame = 1; frame <= fps; frame++) {
      frames.callbacks[frame + 1](1600 + (frame * 1000) / fps)
    }

    const end = camera.position.clone().sub(target)
    expect(Math.atan2(end.x, end.z) - Math.atan2(start.x, start.z)).toBeCloseTo(-Math.PI / 15, 5)
  })

  it('завершает загрузку, запускает анимацию и освобождает модель при размонтировании', async ({ frames, model }) => {
    const screen = await render(<VoxelDog />)
    const status = screen.getByRole('status')
    await expect.element(status).toHaveAttribute('aria-busy', 'true')
    await expect.element(status).toHaveTextContent('Loading 3D voxel dog model...')
    const modelContainer = status.element()
    const canvas = screen.container.querySelector('canvas')
    const loader = screen.container.querySelector('svg')
    await expect.element(canvas).toBeInTheDocument()
    await expect.element(canvas).toHaveAttribute('aria-hidden', 'true')
    await expect.element(loader).toBeVisible()
    await expect.element(loader).toHaveAttribute('aria-hidden', 'true')
    expect(frames.request).not.toHaveBeenCalled()

    const pending = load.mock.calls[0]
    pending[1]({ scene: model })

    await expect.element(loader).not.toBeInTheDocument()
    await expect.element(modelContainer).toHaveAttribute('aria-busy', 'false')
    await expect.element(modelContainer).not.toHaveAttribute('role')
    await expect.element(screen.getByRole('status')).not.toBeInTheDocument()
    await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
    expect(frames.request).toHaveBeenCalledOnce()
    const intro = frames.callbacks[0]
    intro(0)
    const finish = frames.callbacks[1]
    finish(1600)
    const geometry = model.children[0]
    if (!(geometry instanceof Mesh)) throw new Error('В модели нет меша')
    const disposeGeometry = vi.spyOn(geometry.geometry, 'dispose')

    await screen.unmount()

    expect(disposeGeometry).toHaveBeenCalledOnce()
    expect(model.parent).toBeNull()
    expect(frames.cancel).toHaveBeenCalledWith(3)
    await expect.element(canvas).not.toBeInTheDocument()
    const count = frames.request.mock.calls.length
    finish(1760)
    expect(frames.request).toHaveBeenCalledTimes(count)
  })

  it('показывает ошибку загрузки и убирает индикатор', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const screen = await render(<VoxelDog />)

    await expect.element(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')

    const onError = load.mock.calls[0][3]
    if (!onError) throw new Error('Обработчик ошибки не подключён')
    onError(new Error('model unavailable'))

    await expect.element(screen.getByRole('alert')).toHaveTextContent('The 3D model is unavailable.')
    await expect.element(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'false')
    await expect.element(screen.getByRole('status')).not.toBeInTheDocument()
    await expect.element(screen.getByText('The 3D model is unavailable.')).toBeVisible()
    await expect.element(screen.container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('не запускает анимацию при reduced motion и отключает наблюдение за размером', async ({ frames, model }) => {
    let resizeCallback: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    class TestResizeObserver implements ResizeObserver {
      disconnect = disconnect
      observe = vi.fn()
      unobserve = vi.fn()
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    load.mockImplementation((_url, onLoad) => {
      onLoad({ scene: model })
    })
    const screen = await render(<VoxelDog />)
    await expect.element(screen.container.querySelector('svg')).not.toBeInTheDocument()
    await expect.element(screen.container.querySelector('canvas')).toBeInTheDocument()
    expect(frames.request).not.toHaveBeenCalled()
    if (!resizeCallback) throw new Error('Наблюдение за размером не подключено')
    resizeCallback([], { disconnect, observe: vi.fn(), unobserve: vi.fn() })
    expect(frames.request).not.toHaveBeenCalled()

    await screen.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
    // Three.js при освобождении renderer может вызвать cancelAnimationFrame(null).
    // Проверяем только идентификаторы кадров, выданные нашей границей requestAnimationFrame.
    expect(frames.cancel.mock.calls.some(([id]) => typeof id === 'number' && id > 0)).toBe(false)
  })

  it('освобождает модель, загруженную после размонтирования', async ({ model }) => {
    const mesh = model.children[0]
    if (!(mesh instanceof Mesh)) throw new Error('В модели нет меша')
    const disposeGeometry = vi.spyOn(mesh.geometry, 'dispose')
    const screen = await render(<VoxelDog />)
    await screen.unmount()
    const pending = load.mock.calls[0]
    pending[1]({ scene: model })

    await vi.waitFor(() => {
      expect(disposeGeometry).toHaveBeenCalledOnce()
    })
    expect(model.parent).toBeNull()
  })

  it('игнорирует ошибку загрузки после размонтирования', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const screen = await render(<VoxelDog />)
    await screen.unmount()
    const pending = load.mock.calls[0]
    if (!pending[3]) throw new Error('Обработчик ошибки не подключён')
    pending[3](new Error('late failure'))
    await Promise.resolve()

    expect(consoleError).not.toHaveBeenCalled()
  })
})
