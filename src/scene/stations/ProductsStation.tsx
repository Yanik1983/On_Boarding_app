import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, type Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { useStationOfKind } from '../../content/context'
import type { Vec3 } from '../../state/store'
import { useHover, useSelection } from '../interaction'
import { focusOn } from '../layout'
import { Label } from '../Label'
import { ProductModel } from '../models/models'
import { useStationInfo } from '../StationContext'
import { pedestalFocusPoint, pedestalPosition, pedestalScale, PRODUCT_FILTER_KEY, resolveProductFilter } from '../positions'

type Product = StationOf<'products'>['products'][number]

function Pedestal({ product, position, color, scale }: { product: Product; position: Vec3; color: string; scale: number }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const model = useRef<Group>(null)
  const isSelected = selected === product.id

  useFrame((_, delta) => {
    if (model.current && active && !reduced) model.current.rotation.y += delta * (isSelected ? 0.6 : 0.3)
  })

  return (
    <group
      position={position}
      scale={scale}
      {...bind}
      onClick={(e) => {
        e.stopPropagation()
        select(product.id, focusOn(pedestalFocusPoint(position, scale), 3.4 + scale * 1.4, 0.8))
      }}
    >
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.9, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.905, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.4, 0.5, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 3 : hovered ? 2 : 1} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <coneGeometry args={[0.75, 3, 32, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={isSelected ? 0.1 : 0.045} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <group ref={model} position={[0, 1.65, 0]} scale={isSelected ? 0.95 : hovered ? 0.85 : 0.78}>
        <ProductModel type={product.model} />
      </group>
      <Label position={[0, 0.5, 0.6]} fontSize={0.14} maxWidth={1.3} textAlign="center" color={isSelected ? color : '#1b1f24'}>
        {product.name}
      </Label>
    </group>
  )
}

/** A spotlit showroom of pedestals, filtered by business unit. */
export function ProductsStation({ station }: { station: StationOf<'products'> }) {
  const [filterValue] = useSelection(PRODUCT_FILTER_KEY)
  const divisions = useStationOfKind('divisions')
  const firstUnit = divisions?.units.find((u) => station.products.some((p) => p.unit === u.id))?.id
  const filter = resolveProductFilter(filterValue, firstUnit)
  const colorOf = (unit: string) => divisions?.units.find((u) => u.id === unit)?.color ?? station.color
  const products = station.products.filter((p) => !filter || p.unit === filter)

  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[6.3, 6.35, 0.12, 64]} />
        <meshStandardMaterial color="#f7f8fa" roughness={0.25} metalness={0.05} />
      </mesh>
      {products.map((p, i) => (
        <Pedestal key={p.id} product={p} position={pedestalPosition(i, products.length)} scale={pedestalScale(products.length)} color={colorOf(p.unit)} />
      ))}
    </group>
  )
}
