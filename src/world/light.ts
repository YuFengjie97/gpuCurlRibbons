import * as THREE from 'three/webgpu'
import { scene } from './scene'

export function setLight(){
  const amb = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(amb)

  {
    const l = new THREE.PointLight(0xffffff, 1000, 100, 2)
    scene.add(l)
  }
}