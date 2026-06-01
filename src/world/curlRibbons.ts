import { abs, rotate, attribute, cos, cross, fract, dot, float, floor, Fn, 
  fwidth, hash, instancedArray, instanceIndex, max, metalness, min, mix, mod, mx_noise_float, 
  mx_noise_vec3, normalLocal, normalView, positionLocal, pow, select, sin, 
  smoothstep, step, time, transformedNormalView, uniform, uv, varying, 
  vec3, vec4, vertexIndex, 
  vec2,
  cameraPosition,
  length,
  texture,
  cosh,
  PI2,
  PI,
  deltaTime,
  If,
  Loop} from "three/tsl"
import * as THREE from "three/webgpu"


import {scene, renderer, camera} from '@/world/scene'
import { emitter } from "@/utils/emitter"
import {curlNoise4d} from '@/utils/tsl/curlNoise4d'
// import {curlNoise3d} from '@/utils/tsl/curlNoise3d'

export default function Ribbons(){

  const COUNT = 2000
  const segNum = 200
  const ribbonPointsNum = segNum + 1  // 缎带控制点,不是顶点数
  const geo = new THREE.PlaneGeometry(.0001,.0001, segNum, 1)

  // @range: { min: 0.01, max: 1, step: 0.01 }
  const ribbonWidth = uniform(.2)
  // @range: { min: 0, max: 50, step: 0.1 }
  const speed = uniform(10)
  // @range: { min: 0.01, max: 0.1, step: 0.01 }
  const curlScale = uniform(.03)
  // @range: { min: 0, max: .2, step: 0.01 }
  const curlSpeed = uniform(0)
  // @range: { min: 0, max: 5, step: 0.01 }
  const lifeSpeed = uniform(.2)
  // @range: { min: 10, max: 40, step: 0.01 }
  const edge = uniform(40)
  // @range: { min: 0, max: 10, step: 0.01 }
  const colSeed = uniform(new THREE.Vector3(3,2,1))


  // 缎带位置初始化,随机位置
  const ribbonPosArr = new Float32Array(COUNT * 3)
  const posArr = new Float32Array(ribbonPointsNum * COUNT * 3)
  const ribbonLifeArr = new Float32Array(COUNT)

  for(let i=0;i<COUNT;i++){
    // 缎带位置, 或者说是缎带头部位置
    const x = (Math.random() - .5) * edge.value
    const y = (Math.random() - .5) * edge.value
    const z = (Math.random() - .5) * edge.value
    ribbonPosArr[i*3+0] = x
    ribbonPosArr[i*3+1] = y
    ribbonPosArr[i*3+2] = z

    ribbonLifeArr[i] = Math.random()

    // 初始化阶段,让缎带控制点全都挤到头部位置
    for(let j=0;j<ribbonPointsNum;j++){
      const idx = i*ribbonPointsNum + j
      posArr[idx*3+0] = x
      posArr[idx*3+1] = y
      posArr[idx*3+2] = z
    }
  }


  const ribbonPosBuffer = instancedArray(ribbonPosArr, 'vec3')
  const ribbonLifeBuffer = instancedArray(ribbonLifeArr, 'float')
  const posBuffer = instancedArray(posArr, 'vec3')
  const norBuffer = instancedArray(ribbonPointsNum * COUNT, 'vec3')
  const tanBuffer = instancedArray(ribbonPointsNum * COUNT, 'vec3')
  const biTanBuffer = instancedArray(ribbonPointsNum * COUNT, 'vec3')

  const mat = new THREE.MeshBasicNodeMaterial()
  mat.side = THREE.DoubleSide
  mat.transparent = true
  // mat.blending = THREE.AdditiveBlending
  // mat.roughness = .4
  mat.depthWrite = false

  const vCol = varying(vec3(0))
  const vFade = varying(float(1))

  mat.positionNode = Fn(() => {
    const verIdx = float(vertexIndex)
    const ribbonIdx = float(instanceIndex)
    const side = select(verIdx.div(ribbonPointsNum).greaterThan(.999), 1., -1)
    const ribbonPointIdx = mod(verIdx, ribbonPointsNum)
    const ribbonLen01 = ribbonPointIdx.div(ribbonPointsNum)

    const bufferIdx = ribbonIdx.mul(ribbonPointsNum).add(ribbonPointIdx)

    const pos = posBuffer.element(bufferIdx).toVar()
    const biTan = biTanBuffer.element(bufferIdx).toVar()
    const p = pos.add(biTan.mul(side).mul(ribbonWidth))

    const life = ribbonLifeBuffer.element(ribbonIdx).toVar()
    vFade.assign(
      smoothstep(0, .1, life)
      .mul(smoothstep(1, .9, life))
    )


    vCol.assign(
        sin(
            colSeed
              .add(ribbonIdx.mul(.13))
            ).mul(.5).add(.5)
    )

    return p
  })()

  mat.normalNode = Fn(() => {
    const verIdx = float(vertexIndex)
    const ribbonIdx = float(instanceIndex)
    const ribbonPointIdx = mod(verIdx, ribbonPointsNum)
    const bufferIdx = ribbonIdx.mul(ribbonPointsNum).add(ribbonPointIdx)
    const nor = norBuffer.element(bufferIdx).toVar()

    return nor
  })()

  mat.colorNode = Fn(() => {
    return vec4(vCol, vFade)
  })()


  const updateRibbon = Fn(() => {
    const ribbonIdx = float(instanceIndex)

    const pos = vec3(0)

    // 更新生命
    const life = ribbonLifeBuffer.element(ribbonIdx).toVar()
    life.addAssign(deltaTime.mul(lifeSpeed))
    ribbonLifeBuffer.element(ribbonIdx).assign(life)
    If(life.greaterThan(1), () => {
      // 重置生命
      ribbonLifeBuffer.element(ribbonIdx).assign(fract(life))

      // 重置位置
      const pos = vec3(
                    hash(float(ribbonIdx.mul(13.25).add(12.45).add(time))).sub(.5).mul(edge),
                    hash(float(ribbonIdx.mul(13.25).add(41.34).add(time))).sub(.5).mul(edge),
                    hash(float(ribbonIdx.mul(13.25).add(67.21).add(time))).sub(.5).mul(edge)
                  )
      ribbonPosBuffer.element(ribbonIdx).assign(pos)
      
      // 跟初始化逻辑相似,只不过这里是tsl版本
      const value = float(ribbonPointsNum - 1);
      // @ts-ignore
      Loop(value.greaterThan(-1), () => {
        const bufferIdx = ribbonIdx.mul(ribbonPointsNum).add(value)
        posBuffer.element(bufferIdx).assign(pos)
        norBuffer.element(bufferIdx).assign(vec3(0))
        tanBuffer.element(bufferIdx).assign(vec3(0))
        biTanBuffer.element(bufferIdx).assign(vec3(0))
        value.subAssign( 1 );
      })
    })

    // 更新位置
    // 新头部位置
    pos.assign(ribbonPosBuffer.element(ribbonIdx))
    // const vel = curlNoise3d(pos.mul(curlScale))
    const vel = curlNoise4d(vec4(pos.mul(curlScale), time.mul(curlSpeed)))


    pos.addAssign(vel.mul(deltaTime).mul(speed))
    ribbonPosBuffer.element(ribbonIdx).assign(pos)
    const tan = vel.toVar().normalize()
  
    // const norHelp = vec3(
    //   hash(ribbonIdx.mul(13.92).add(82.82)),
    //   hash(ribbonIdx.mul(97.73).add(29.38)),
    //   hash(ribbonIdx.mul(53.68).add(95.93)),
    // ).normalize()
    // const norHelp = vec3(3,-2,1).normalize()
    // const norHelp = rotate(tan, vec3(.001,.001,.001)).normalize()
    const norHelp = tan.add(vec3(.00001)).normalize()
    const nor = cross(tan, norHelp).normalize()
    const biTan = cross(tan, nor).normalize()

    // loop 更新 缎带控制点
    // 因为gpu计算节点是并行计算,不能为每个控制点分配计算节点(这样会无法取得前一个点),只能为每个缎带分配,然后for循环
    const value = float(ribbonPointsNum - 1);
    // @ts-ignore
    Loop(value.greaterThan(-1), () => {

      const ribbonPointIdx = value
      const bufferIdx = ribbonIdx.mul(ribbonPointsNum).add(ribbonPointIdx)
      const bufferIdxPre = bufferIdx.sub(1)

      // 头部位置使用新头部
      If(ribbonPointIdx.equal(0), () => {
        posBuffer.element(bufferIdx).assign(pos)
        norBuffer.element(bufferIdx).assign(nor)
        tanBuffer.element(bufferIdx).assign(tan)
        biTanBuffer.element(bufferIdx).assign(biTan)
      })

      // 尾部队列继承前一个点
      .Else(() => {
        posBuffer.element(bufferIdx).assign(
          posBuffer.element(bufferIdxPre)
        )

        norBuffer.element(bufferIdx).assign(
          norBuffer.element(bufferIdxPre)
        )

        tanBuffer.element(bufferIdx).assign(
          tanBuffer.element(bufferIdxPre)
        )

        biTanBuffer.element(bufferIdx).assign(
          biTanBuffer.element(bufferIdxPre)
        )
      })

      value.subAssign( 1 );
    } );


  })().compute(COUNT)



  emitter.on('animate', () => {
    renderer.compute(updateRibbon)
  })

  const ins = new THREE.InstancedMesh(geo, mat, COUNT)
  ins.frustumCulled = false

  scene.add(ins)
}