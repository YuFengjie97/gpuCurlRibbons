import './style.css'
import { initScene, scene, camera } from './world/scene'
import * as THREE from 'three'
import {setEnv} from './world/envMap'
// import GlowCrystal from './world/glowCrystal'
import { setLight } from './world/light'
import Ribbons from './world/curlRibbons'



(async() => {
  await initScene()
  camera.position.set(0,1,50)

  // const axesHelper = new THREE.AxesHelper(10)
  // scene.add(axesHelper)

  // scene.background = new THREE.Color(0x000000)

  setLight()
  setEnv()

  Ribbons()
})()