import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  var wgsl = `diagnostic(off,derivative_uniformity);
struct Uniforms {
  a: vec4f,
  b: vec4f,
  windowCol: vec4f,
  coreCol: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

fn hash2(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn sdBox(p: vec3f, b: vec3f) -> f32 {
  let q = abs(p) - b;
  return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

fn sdTorus(p: vec3f, t: vec2f) -> f32 {
  let q = vec2f(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

fn rotX(p: vec3f, a: f32) -> vec3f {
  let c = cos(a);
  let s = sin(a);
  return vec3f(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

fn rotZ(p: vec3f, a: f32) -> vec3f {
  let c = cos(a);
  let s = sin(a);
  return vec3f(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

fn towerDist(p: vec3f, id: vec2f) -> f32 {
  if (length(id) < 2.2 || hash2(id + vec2f(9.2, 1.3)) > 0.82) {
    return 1000.0;
  }
  let local = p.xz - id * 3.0;
  let r = hash2(id);
  let h = 0.4 + 9.0 * r * r * r * r;
  let w = 0.55 + 0.35 * hash2(id + vec2f(3.1, 7.7));
  return sdBox(vec3f(local.x, p.y - h, local.y), vec3f(w, h, w));
}

// Circuit-board traces on the ground: edges of a square lattice light up at random as traces;
// pads sit where a trace ends or several meet, and small pulses run along the traces.
fn edgeX(i: vec2f) -> bool {
  return hash2(i + vec2f(17.3, 5.1)) > 0.52;
}

fn edgeZ(i: vec2f) -> bool {
  return hash2(i + vec2f(2.7, 31.9)) > 0.58;
}

// returns (trace, pad, pulse) for lattice coordinates q; w is the edge softness
fn circuit(q: vec2f, w: f32, t: f32) -> vec3f {
  let v = floor(q + vec2f(0.5));
  let f = q - v;
  var trace = 0.0;
  var pulse = 0.0;
  // the edge along x on this side of the lattice point
  let ex = vec2f(select(v.x - 1.0, v.x, f.x >= 0.0), v.y);
  if (edgeX(ex)) {
    let line = 1.0 - smoothstep(0.03, 0.03 + w, abs(f.y));
    trace = max(trace, line);
    pulse = max(pulse, line * pow(0.5 + 0.5 * sin(q.x * 2.2 - t * 2.6 + hash2(ex) * 6.28), 14.0));
  }
  let ez = vec2f(v.x, select(v.y - 1.0, v.y, f.y >= 0.0));
  if (edgeZ(ez)) {
    let line = 1.0 - smoothstep(0.03, 0.03 + w, abs(f.x));
    trace = max(trace, line);
    pulse = max(pulse, line * pow(0.5 + 0.5 * sin(q.y * 2.2 - t * 2.6 + hash2(ez) * 6.28), 14.0));
  }
  var links = 0;
  if (edgeX(v)) { links += 1; }
  if (edgeX(v - vec2f(1.0, 0.0))) { links += 1; }
  if (edgeZ(v)) { links += 1; }
  if (edgeZ(v - vec2f(0.0, 1.0))) { links += 1; }
  var pad = 0.0;
  if (links == 1 || (links >= 3 && hash2(v + vec2f(8.8, 3.3)) > 0.4)) {
    let r = length(f);
    let padDot = 1.0 - smoothstep(0.07, 0.07 + w, r);
    let ring = 1.0 - smoothstep(0.014, 0.014 + w, abs(r - 0.15));
    pad = max(padDot, ring * 0.8);
  }
  return vec3f(trace, pad, pulse);
}

fn scene(p: vec3f) -> vec2f {
  let t = u.a.z;
  var res = vec2f(p.y, 0.0);
  let base = floor(p.xz / 3.0 + 0.5);
  for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
      let d = towerDist(p, base + vec2f(f32(i), f32(j)));
      if (d < res.x) {
        res = vec2f(d, 1.0);
      }
    }
  }
  // the spire ends just under the orb (bottom at y 6.84 at its smallest), so the orb sits on top of it
  let spire = sdBox(p - vec3f(0.0, 3.4, 0.0), vec3f(0.32, 3.4, 0.32));
  if (spire < res.x) {
    res = vec2f(spire, 2.0);
  }
  let orbP = p - vec3f(0.0, 8.0, 0.0);
  let orb = length(orbP) - (1.1 + 0.06 * sin(t * 2.0));
  if (orb < res.x) {
    res = vec2f(orb, 3.0);
  }
  let r1 = sdTorus(rotX(orbP, 0.35 + t * 0.4), vec2f(2.1, 0.035));
  let r2 = sdTorus(rotZ(rotX(orbP, -0.5), t * 0.3), vec2f(2.7, 0.03));
  let rings = min(r1, r2);
  if (rings < res.x) {
    res = vec2f(rings, 4.0);
  }
  return res;
}

fn calcNormal(p: vec3f) -> vec3f {
  let e = vec2f(0.002, -0.002);
  return normalize(
    e.xyy * scene(p + e.xyy).x +
    e.yyx * scene(p + e.yyx).x +
    e.yxy * scene(p + e.yxy).x +
    e.xxx * scene(p + e.xxx).x);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(u.a.x, u.a.y);
  let t = u.a.z;
  let pr = clamp(u.a.w, 0.0, 1.0);
  var ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  ndc.x = ndc.x * size.x / max(size.y, 1.0);

  let m = (u.b.xy - vec2f(0.5)) * u.b.w;
  let ease = smoothstep(0.0, 1.0, pr);
  let ang = 0.6 + pr * 3.6 + m.x * 0.4;
  let rad = mix(24.0, 8.5, ease);
  let hgt = mix(15.0, 2.2, ease) - m.y * 1.5;
  let ro = vec3f(sin(ang) * rad, hgt, cos(ang) * rad);
  let ta = vec3f(0.0, mix(6.5, 5.0, pr), 0.0);
  let fw = normalize(ta - ro);
  let rt = normalize(cross(fw, vec3f(0.0, 1.0, 0.0)));
  let up = cross(rt, fw);
  let rd = normalize(fw * 1.6 + rt * ndc.x + up * ndc.y);

  let blue = vec3f(0.25, 0.55, 1.0);
  let teal = vec3f(0.15, 0.95, 0.85);
  let violet = vec3f(0.62, 0.42, 1.0);
  let tint = mix(mix(blue, teal, smoothstep(0.0, 0.5, pr)), violet, smoothstep(0.5, 1.0, pr));
  let winCol = mix(u.windowCol.rgb, tint, 0.5);
  let coreCol = u.coreCol.rgb;

  var dist = 0.0;
  var hit = -1.0;
  var glow = 0.0;
  var p = ro;
  for (var i = 0; i < 110; i++) {
    p = ro + rd * dist;
    let h = scene(p);
    glow = glow + exp(-max(length(p - vec3f(0.0, 8.0, 0.0)) - 1.1, 0.0) * 1.6) * 0.02;
    if (h.x < 0.002 * dist + 0.0005) {
      hit = h.y;
      break;
    }
    dist = dist + h.x * 0.8;
    if (dist > 90.0) {
      break;
    }
  }

  // a light horizon, so the skyline stands out against it
  let skyTop = vec3f(0.006, 0.01, 0.026);
  let skyHor = vec3f(0.06, 0.1, 0.19) + tint * 0.07;
  var col = mix(skyHor, skyTop, pow(clamp(rd.y * 2.2, 0.0, 1.0), 0.6));
  col = col + (tint * 0.6 + vec3f(0.25, 0.35, 0.5)) * 0.1 * exp(-abs(rd.y) * 14.0);
  let starCell = floor(vec2f(atan2(rd.z, rd.x), rd.y) * 220.0);
  col = col + vec3f(step(0.997, hash2(starCell)) * 0.7 * clamp(rd.y * 4.0, 0.0, 1.0));

  if (hit >= 0.0) {
    let n = calcNormal(p);
    let ld = normalize(vec3f(0.4, 0.8, 0.3));
    let dif = clamp(dot(n, ld), 0.0, 1.0);
    let rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
    // light on the buildings: the facade colour is lit by the key light, the sky (from above) and the
    // horizon glow (from the side), plus the glowing core, which lights what is near it
    let albedo = vec3f(0.07, 0.09, 0.14);
    let skyFill = 0.25 + 0.35 * clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
    let horizonFill = clamp(1.0 - abs(n.y), 0.0, 1.0) * 0.3;
    let toCore = vec3f(0.0, 8.0, 0.0) - p;
    let coreDist = length(toCore);
    let coreLight = clamp(dot(n, toCore / coreDist), 0.0, 1.0) * 4.0 / (1.0 + coreDist * coreDist * 0.05);
    var surf = albedo * (skyFill + horizonFill + 1.1 * dif) + coreCol * coreLight * 0.3 * u.b.z + tint * rim * 0.16;
    if (hit < 0.5) {
      let g = abs(fract(p.xz / 3.0 + 0.5) - vec2f(0.5));
      let street = smoothstep(0.46, 0.5, max(g.x, g.y));
      let pulse = 0.5 + 0.5 * sin(length(p.xz) * 0.8 - t * 2.5);
      let fade = exp(-dist * 0.05);
      let c = circuit(p.xz / 0.75, 0.02 + dist * 0.004, t);
      let padCol = mix(tint, coreCol, 0.5);
      surf = vec3f(0.008, 0.012, 0.022) + coreCol * coreLight * 0.12 * u.b.z
        + tint * street * (0.4 + 1.0 * pulse) * fade
        + (tint * (c.x * 0.38 + c.z * 1.3) + padCol * c.y * 1.0) * exp(-dist * 0.042);
    } else if (hit < 1.5) {
      let id = floor(p.xz / 3.0 + 0.5);
      let wy = step(0.55, fract(p.y * 2.2));
      let wx = step(0.5, fract((p.x + p.z) * 2.5));
      let lit = step(0.72, hash2(floor(vec2f(p.y * 2.2, (p.x + p.z) * 2.5)) + id));
      let flick = 0.6 + 0.4 * sin(t * 1.5 + hash2(id) * 6.28);
      surf = surf + winCol * wy * wx * lit * flick * 1.8 * (1.0 - abs(n.y));
    } else if (hit < 2.5) {
      surf = surf + tint * 0.9 * pow(0.5 + 0.5 * sin(p.y * 2.0 - t * 3.0), 6.0);
    } else if (hit < 3.5) {
      surf = coreCol * 1.6 + vec3f(0.3) * rim;
    } else {
      surf = coreCol * 2.0;
    }
    col = mix(skyHor, surf, exp(-dist * 0.028));
  }

  col = col + coreCol * glow * u.b.z;
  col = col * (1.0 - 0.35 * dot(ndc * 0.6, ndc * 0.6));
  col = vec3f(1.0) - exp(-max(col, vec3f(0.0)) * 1.5);
  return vec4f(col, 1.0);
}
`
  frame.state.module = device.createShaderModule({ code: wgsl })
  frame.state.pipeline = null
  frame.state.pipelineFormat = null

  frame.state.quad = device.createBuffer({
    size: 6 * 4 * 4,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(frame.state.quad.getMappedRange()).set([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    -1, 1, 0, 0,
    1, -1, 1, 1,
    1, 1, 1, 0,
  ])
  frame.state.quad.unmap()

  frame.state.uniforms = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
}

export function render(device, frame) {
  var params = frame.params || {}
  function num(value, fallback) {
    var n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  function channel(color, key, fallback) {
    return num((color || {})[key], fallback)
  }
  var width = frame.output.width
  var height = frame.output.height
  var mouse = frame.mousePosition
  // a static render reports the mouse at (0, 0); treat that as no mouse so the canvas and the website start alike
  var hasMouse = mouse != null && Number.isFinite(Number(mouse.x)) && Number.isFinite(Number(mouse.y)) && (Number(mouse.x) !== 0 || Number(mouse.y) !== 0)
  var mx = hasMouse ? Math.min(Math.max(Number(mouse.x) / Math.max(width, 1), 0), 1) : 0.5
  var my = hasMouse ? Math.min(Math.max(Number(mouse.y) / Math.max(height, 1), 0), 1) : 0.5
  var seconds = num(frame.time, 0) * 0.001 * num(params.speed, 1)

  device.queue.writeBuffer(frame.state.uniforms, 0, new Float32Array([
    width, height, seconds, num(params.progress, 0),
    mx, my, num(params.glow, 1), hasMouse ? num(params.mouseFollow, 1) : 0,
    channel(params.windowColor, 'r', 0.35), channel(params.windowColor, 'g', 0.6), channel(params.windowColor, 'b', 1), 1,
    channel(params.coreColor, 'r', 0.2), channel(params.coreColor, 'g', 0.95), channel(params.coreColor, 'b', 0.9), 1,
  ]))

  var outputFormat = frame.output.format
  if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
    frame.state.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: frame.state.module,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, format: 'float32x2', offset: 0 },
            { shaderLocation: 1, format: 'float32x2', offset: 8 },
          ],
        }],
      },
      fragment: {
        module: frame.state.module,
        entryPoint: 'fs_main',
        targets: [{ format: outputFormat }],
      },
      primitive: { topology: 'triangle-list' },
    })
    frame.state.pipelineFormat = outputFormat
  }

  var encoder = device.createCommandEncoder()
  var pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: frame.output.createView(),
      loadOp: 'clear',
      clearValue: { r: 0, g: 0, b: 0, a: 0 },
      storeOp: 'store',
    }],
  })
  pass.setPipeline(frame.state.pipeline)
  var bindGroup = device.createBindGroup({
    layout: frame.state.pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: frame.state.uniforms } }],
  })
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, frame.state.quad)
  pass.draw(6)
  pass.end()
  device.queue.submit([encoder.finish()])
}

defineProperties(Effect, {
  progress: {
    type: 'number',
    label: 'Progress',
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.01,
    control: 'slider',
  },
  speed: {
    type: 'number',
    label: 'Speed',
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.05,
    control: 'slider',
  },
  glow: {
    type: 'number',
    label: 'Core glow',
    defaultValue: 1,
    min: 0,
    max: 3,
    step: 0.05,
    control: 'slider',
  },
  mouseFollow: {
    type: 'number',
    label: 'Mouse follow',
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.05,
    control: 'slider',
  },
  windowColor: {
    type: 'color',
    label: 'Window light',
    defaultValue: { r: 0.35, g: 0.6, b: 1, a: 1 },
  },
  coreColor: {
    type: 'color',
    label: 'Core light',
    defaultValue: { r: 0.2, g: 0.95, b: 0.9, a: 1 },
  },
})
