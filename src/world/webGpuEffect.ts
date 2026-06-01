import {renderer, scene, camera} from '@/world/scene'
import * as THREE from 'three/webgpu'
import {pass, uniform} from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { pane } from '@/utils/pane';

export function getRenderPipeline() {

  // @range: { min: 0, max: 1, step: 0.01 }
  const strength = uniform(.3)
  // @range: { min: 0, max: 1, step: 0.01 }
  const radius = uniform(.2)
  // @range: { min: 0, max: 1, step: 0.01 }
  const threshold = uniform(.8) 

  const renderPipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const bloomPass = bloom(scenePassColor, strength.value, radius.value, threshold.value);
  renderPipeline.outputNode = scenePassColor.add(bloomPass);

  bloomPass.strength = strength
  bloomPass.radius = radius
  bloomPass.threshold = threshold



  
  // const f = pane!.addFolder({title: 'bloom', expanded: false})
  // f!.addBinding(bloomPass.strength, 'value', {label: 'strength', min: 0, max:1})
  // f!.addBinding(bloomPass.radius, 'value', {label: 'radius', min: 0, max:1})
  // f!.addBinding(bloomPass.threshold, 'value', {label: 'threshold', min: 0, max:1})


  return {renderPipeline}
}