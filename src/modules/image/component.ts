import { createCanvas } from 'canvas'
import { Coord, Layer, getViewport, renderMap } from '../render'
import { IMapComponent, Tile, TileType } from '../map/types'
import { coordsToId, isExpired as isOrderExpired } from '../map/utils'
import { isExpired as isRentalExpired } from '../../logic/rental'
import { IImageComponent } from './types'

export function createImageComponent(components: {
  map: IMapComponent
}): IImageComponent {
  const { map } = components

  function getColor(tile: Tile) {
    switch (tile.type) {
      case TileType.DISTRICT:
        return '#8647d3'
      case TileType.PLAZA:
        return '#7145b7'
      case TileType.ROAD:
        return '#A9A9A9'
      case TileType.OWNED:
        return '#ff00ee'
      case TileType.UNOWNED:
        return '#FFC300'
    }
  }

  async function getStream(
    width: number,
    height: number,
    size: number,
    center: Coord,
    selected: Coord[],
    showOnSale: boolean,
    showOnRent: boolean
  ) {
    const pan = { x: 0, y: 0 }
    const { nw, se } = getViewport({ width, height, center, size, padding: 1 })
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const tiles = await map.getTiles()
    const layer: Layer = (x, y) => {
      const id = coordsToId(x, y)
      const tile = tiles[id]
      const isOnSale = showOnSale && tile.price && !isOrderExpired(tile)
      const isListedForRent =
        showOnRent && tile.rentalListing && !isRentalExpired(tile.rentalListing)
      const result = tile
        ? {
            color: isOnSale || isListedForRent ? '#c849e5' : getColor(tile),
            top: tile.top,
            left: tile.left,
            topLeft: tile.topLeft,
          }
        : {
            color: (x + y) % 2 === 0 ? '#28262a' : '#3d3b3e',
          }
      return result
    }
    const layers = [layer]

    // render selected tiles
    if (selected.length > 0) {
      const selection = new Set(
        selected.map((coords) => coordsToId(coords.x, coords.y))
      )
      const strokeLayer: Layer = (x, y) =>
        selection.has(coordsToId(x, y))
          ? { color: '#9149e7', scale: 1.4 }
          : null
      const fillLayer: Layer = (x, y) =>
        selection.has(coordsToId(x, y))
          ? { color: '#9e60ea', scale: 1.2 }
          : null
      layers.push(strokeLayer)
      layers.push(fillLayer)
    }

    renderMap({
      ctx,
      width,
      height,
      size,
      pan,
      center,
      nw,
      se,
      layers,
    })
    return canvas.createPNGStream()
  }
  return {
    getStream,
  }
}
