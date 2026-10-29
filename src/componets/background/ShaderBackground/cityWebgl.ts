// The 3D city for browsers without WebGPU (Chrome on many Android GPUs, older Safari, Firefox on
// Android and Mac): the same scene as shaders/city-shader.ts, drawn with WebGL2.
//
// shaders/city-shader.ts stays exactly as Figma exports it, so its WGSL is translated here by hand,
// line for line; change both together. The uniforms are filled the way that shader's render() does.

import { cityBudget, webglGpuVendor } from '../deviceProfile';
import type { LiveParams, ShaderModule, ShaderOptions } from './figmaShaderHost';
import { MAX_FPS, startShaderLoop } from './shaderLoop';

const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // the same uv as the WGSL quad: (0, 0) at the top left
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec4 uA;
uniform vec4 uB;
uniform vec4 uWindowCol;
uniform vec4 uCoreCol;

in vec2 vUv;
out vec4 outColor;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, vec3(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

vec3 rotX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotZ(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

float towerDist(vec3 p, vec2 id) {
  if (length(id) < 2.2 || hash2(id + vec2(9.2, 1.3)) > 0.82) {
    return 1000.0;
  }
  vec2 local = p.xz - id * 3.0;
  float r = hash2(id);
  float h = 0.4 + 9.0 * r * r * r * r;
  float w = 0.55 + 0.35 * hash2(id + vec2(3.1, 7.7));
  return sdBox(vec3(local.x, p.y - h, local.y), vec3(w, h, w));
}

bool edgeX(vec2 i) {
  return hash2(i + vec2(17.3, 5.1)) > 0.52;
}

bool edgeZ(vec2 i) {
  return hash2(i + vec2(2.7, 31.9)) > 0.58;
}

vec3 circuit(vec2 q, float w, float t) {
  vec2 v = floor(q + vec2(0.5));
  vec2 f = q - v;
  float trace = 0.0;
  float pulse = 0.0;
  vec2 ex = vec2(f.x >= 0.0 ? v.x : v.x - 1.0, v.y);
  if (edgeX(ex)) {
    float ln = 1.0 - smoothstep(0.03, 0.03 + w, abs(f.y));
    trace = max(trace, ln);
    pulse = max(pulse, ln * pow(0.5 + 0.5 * sin(q.x * 2.2 - t * 2.6 + hash2(ex) * 6.28), 14.0));
  }
  vec2 ez = vec2(v.x, f.y >= 0.0 ? v.y : v.y - 1.0);
  if (edgeZ(ez)) {
    float ln = 1.0 - smoothstep(0.03, 0.03 + w, abs(f.x));
    trace = max(trace, ln);
    pulse = max(pulse, ln * pow(0.5 + 0.5 * sin(q.y * 2.2 - t * 2.6 + hash2(ez) * 6.28), 14.0));
  }
  int links = 0;
  if (edgeX(v)) { links += 1; }
  if (edgeX(v - vec2(1.0, 0.0))) { links += 1; }
  if (edgeZ(v)) { links += 1; }
  if (edgeZ(v - vec2(0.0, 1.0))) { links += 1; }
  float pad = 0.0;
  if (links == 1 || (links >= 3 && hash2(v + vec2(8.8, 3.3)) > 0.4)) {
    float r = length(f);
    float padDot = 1.0 - smoothstep(0.07, 0.07 + w, r);
    float ring = 1.0 - smoothstep(0.014, 0.014 + w, abs(r - 0.15));
    pad = max(padDot, ring * 0.8);
  }
  return vec3(trace, pad, pulse);
}

vec2 scene(vec3 p) {
  float t = uA.z;
  vec2 res = vec2(p.y, 0.0);
  vec2 base = floor(p.xz / 3.0 + 0.5);
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      float d = towerDist(p, base + vec2(float(i), float(j)));
      if (d < res.x) {
        res = vec2(d, 1.0);
      }
    }
  }
  float spire = sdBox(p - vec3(0.0, 3.4, 0.0), vec3(0.32, 3.4, 0.32));
  if (spire < res.x) {
    res = vec2(spire, 2.0);
  }
  vec3 orbP = p - vec3(0.0, 8.0, 0.0);
  float orb = length(orbP) - (1.1 + 0.06 * sin(t * 2.0));
  if (orb < res.x) {
    res = vec2(orb, 3.0);
  }
  float r1 = sdTorus(rotX(orbP, 0.35 + t * 0.4), vec2(2.1, 0.035));
  float r2 = sdTorus(rotZ(rotX(orbP, -0.5), t * 0.3), vec2(2.7, 0.03));
  float rings = min(r1, r2);
  if (rings < res.x) {
    res = vec2(rings, 4.0);
  }
  return res;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.002, -0.002);
  return normalize(
    e.xyy * scene(p + e.xyy).x +
    e.yyx * scene(p + e.yyx).x +
    e.yxy * scene(p + e.yxy).x +
    e.xxx * scene(p + e.xxx).x);
}

void main() {
  vec2 size = uA.xy;
  float t = uA.z;
  float pr = clamp(uA.w, 0.0, 1.0);
  vec2 ndc = vec2(vUv.x * 2.0 - 1.0, 1.0 - vUv.y * 2.0);
  ndc.x = ndc.x * size.x / max(size.y, 1.0);

  vec2 m = (uB.xy - vec2(0.5)) * uB.w;
  float ease = smoothstep(0.0, 1.0, pr);
  float ang = 0.6 + pr * 3.6 + m.x * 0.4;
  // the camera dollies in but stays above the roofs (the tallest tower is 9.4 high), so near
  // facades never fill the screen as large flat slabs
  float rad = mix(24.0, 13.5, ease);
  float hgt = max(mix(15.0, 10.5, ease) - m.y * 1.5, 10.0);
  vec3 ro = vec3(sin(ang) * rad, hgt, cos(ang) * rad);
  vec3 ta = vec3(0.0, mix(6.5, 5.0, pr), 0.0);
  vec3 fw = normalize(ta - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 1.6 + rt * ndc.x + up * ndc.y);

  vec3 blue = vec3(0.25, 0.55, 1.0);
  vec3 teal = vec3(0.15, 0.95, 0.85);
  vec3 violet = vec3(0.62, 0.42, 1.0);
  vec3 tint = mix(mix(blue, teal, smoothstep(0.0, 0.5, pr)), violet, smoothstep(0.5, 1.0, pr));
  vec3 winCol = mix(uWindowCol.rgb, tint, 0.5);
  vec3 coreCol = uCoreCol.rgb;

  float dist = 0.0;
  float hit = -1.0;
  float glow = 0.0;
  vec3 p = ro;
  for (int i = 0; i < 110; i++) {
    p = ro + rd * dist;
    vec2 h = scene(p);
    glow = glow + exp(-max(length(p - vec3(0.0, 8.0, 0.0)) - 1.1, 0.0) * 1.6) * 0.02;
    if (h.x < 0.002 * dist + 0.0005) {
      hit = h.y;
      break;
    }
    dist = dist + h.x * 0.8;
    if (dist > 90.0) {
      break;
    }
  }

  vec3 skyTop = vec3(0.006, 0.01, 0.026);
  vec3 skyHor = vec3(0.06, 0.1, 0.19) + tint * 0.07;
  vec3 col = mix(skyHor, skyTop, pow(clamp(rd.y * 2.2, 0.0, 1.0), 0.6));
  col = col + (tint * 0.6 + vec3(0.25, 0.35, 0.5)) * 0.1 * exp(-abs(rd.y) * 14.0);
  vec2 starCell = floor(vec2(atan(rd.z, rd.x), rd.y) * 220.0);
  col = col + vec3(step(0.997, hash2(starCell)) * 0.7 * clamp(rd.y * 4.0, 0.0, 1.0));

  if (hit >= 0.0) {
    vec3 n = calcNormal(p);
    vec3 ld = normalize(vec3(0.4, 0.8, 0.3));
    float dif = clamp(dot(n, ld), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
    vec3 albedo = vec3(0.07, 0.09, 0.14);
    float skyFill = 0.25 + 0.35 * clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
    float horizonFill = clamp(1.0 - abs(n.y), 0.0, 1.0) * 0.3;
    vec3 toCore = vec3(0.0, 8.0, 0.0) - p;
    float coreDist = length(toCore);
    float coreLight = clamp(dot(n, toCore / coreDist), 0.0, 1.0) * 4.0 / (1.0 + coreDist * coreDist * 0.05);
    vec3 surf = albedo * (skyFill + horizonFill + 1.1 * dif) + coreCol * coreLight * 0.3 * uB.z + tint * rim * 0.16;
    if (hit < 0.5) {
      vec2 g = abs(fract(p.xz / 3.0 + 0.5) - vec2(0.5));
      float street = smoothstep(0.46, 0.5, max(g.x, g.y));
      float pulse = 0.5 + 0.5 * sin(length(p.xz) * 0.8 - t * 2.5);
      float fade = exp(-dist * 0.05);
      vec3 c = circuit(p.xz / 0.75, 0.02 + dist * 0.004, t);
      vec3 padCol = mix(tint, coreCol, 0.5);
      surf = vec3(0.008, 0.012, 0.022) + coreCol * coreLight * 0.12 * uB.z
        + tint * street * (0.4 + 1.0 * pulse) * fade
        + (tint * (c.x * 0.38 + c.z * 1.3) + padCol * c.y * 1.0) * exp(-dist * 0.042);
    } else if (hit < 1.5) {
      vec2 id = floor(p.xz / 3.0 + 0.5);
      float wy = step(0.55, fract(p.y * 2.2));
      float wx = step(0.5, fract((p.x + p.z) * 2.5));
      float lit = step(0.72, hash2(floor(vec2(p.y * 2.2, (p.x + p.z) * 2.5)) + id));
      float flick = 0.6 + 0.4 * sin(t * 1.5 + hash2(id) * 6.28);
      surf = surf + winCol * wy * wx * lit * flick * 1.8 * (1.0 - abs(n.y));
    } else if (hit < 2.5) {
      surf = surf + tint * 0.9 * pow(0.5 + 0.5 * sin(p.y * 2.0 - t * 3.0), 6.0);
    } else if (hit < 3.5) {
      surf = coreCol * 1.6 + vec3(0.3) * rim;
    } else {
      surf = coreCol * 2.0;
    }
    col = mix(skyHor, surf, exp(-dist * 0.028));
  }

  col = col + coreCol * glow * uB.z;
  col = col * (1.0 - 0.35 * dot(ndc * 0.6, ndc * 0.6));
  col = vec3(1.0) - exp(-max(col, vec3(0.0)) * 1.5);
  outColor = vec4(col, 1.0);
}
`;

type Color = { r?: unknown; g?: unknown; b?: unknown };

function num(value: unknown, fallback: number) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// The 16 uniform floats city-shader.ts's render() writes, from the same params and frame values
function cityUniforms(
    params: Record<string, unknown>,
    width: number,
    height: number,
    time: number,
    mouse: { x: number; y: number } | null,
) {
    // a static render reports the mouse at (0, 0); treated as no mouse, as in render()
    const hasMouse = mouse !== null && (mouse.x !== 0 || mouse.y !== 0);
    const mx = hasMouse ? Math.min(Math.max(mouse.x / Math.max(width, 1), 0), 1) : 0.5;
    const my = hasMouse ? Math.min(Math.max(mouse.y / Math.max(height, 1), 0), 1) : 0.5;
    const seconds = time * 0.001 * num(params.speed, 1);
    const windowColor = (params.windowColor ?? {}) as Color;
    const coreColor = (params.coreColor ?? {}) as Color;
    return {
        a: [width, height, seconds, num(params.progress, 0)],
        b: [mx, my, num(params.glow, 1), hasMouse ? num(params.mouseFollow, 1) : 0],
        windowCol: [num(windowColor.r, 0.35), num(windowColor.g, 0.6), num(windowColor.b, 1), 1],
        coreCol: [num(coreColor.r, 0.2), num(coreColor.g, 0.95), num(coreColor.b, 0.9), 1],
    };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('WebGL could not create a shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`WebGL shader did not compile: ${log}`);
    }
    return shader;
}

// Starts the WebGL city on the canvas and returns a function that stops it.
// The params defaults come from the Figma shader's definitions, so both versions match.
export function runCityWebgl(
    canvas: HTMLCanvasElement,
    shader: Pick<ShaderModule, 'definitions'>,
    live: LiveParams,
    {
        maxPixelRatio = 1.25,
        minPixelRatio = 0.35,
        budget = (vendor) => cityBudget(vendor, false),
        idleFps = MAX_FPS,
        idle = () => false,
        onDeviceLost,
        onTooSlow,
    }: ShaderOptions = {},
): () => void {
    const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
    });
    if (!gl) {
        throw new Error('No WebGL2');
    }

    const program = gl.createProgram();
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`WebGL program did not link: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        a: gl.getUniformLocation(program, 'uA'),
        b: gl.getUniformLocation(program, 'uB'),
        windowCol: gl.getUniformLocation(program, 'uWindowCol'),
        coreCol: gl.getUniformLocation(program, 'uCoreCol'),
    };

    const params: Record<string, unknown> = Object.fromEntries(
        Object.entries(shader.definitions).map(([name, definition]) => [name, definition.defaultValue]),
    );

    // the browser drops the context when the GPU resets or the tab is evicted on a phone
    const handleLost = (event: Event) => {
        event.preventDefault();
        onDeviceLost?.();
    };
    canvas.addEventListener('webglcontextlost', handleLost);

    const stopLoop = startShaderLoop(
        canvas,
        ({ width, height, time, mouse }) => {
            for (const [name, read] of Object.entries(live)) {
                params[name] = read();
            }
            const values = cityUniforms(params, width, height, time, mouse);
            gl.viewport(0, 0, width, height);
            gl.uniform4fv(uniforms.a, values.a);
            gl.uniform4fv(uniforms.b, values.b);
            gl.uniform4fv(uniforms.windowCol, values.windowCol);
            gl.uniform4fv(uniforms.coreCol, values.coreCol);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
        { maxPixelRatio, minPixelRatio, budget: budget(webglGpuVendor()), idleFps, idle, onTooSlow },
    );

    return () => {
        stopLoop();
        canvas.removeEventListener('webglcontextlost', handleLost);
        gl.deleteBuffer(quad);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
    };
}
