
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import { usePortalStore } from '@stores';
/**
 * FluidCursorTrail
 *
 * Renders a WebGL fluid simulation on a fixed transparent canvas.
 * Colours are tuned to match the portfolio palette:
 *   light theme  →  #0690d4 (sky-blue) family
 *   dark theme   →  deep indigo / violet family
 *
 * The canvas uses pointer-events:none so it never intercepts R3F events.
 * Global opacity is capped at ~35% via the colour multiplier.
 */
const FluidCursorTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePortalId = usePortalStore((state) => state.activePortalId);
  useEffect(() => {
    /* eslint-disable react-hooks/rules-of-hooks */

    const canvas = canvasRef.current;
    if (!canvas) return;
    // ─── config ───────────────────────────────────────────────────────────────
    const config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1440,
      DENSITY_DISSIPATION: 3.5,     // Long, lingering comet tail
      VELOCITY_DISSIPATION: 1.9,
      PRESSURE: 0.2,
      PRESSURE_ITERATIONS: 10,
      CURL: 10,                   // Low curl for a more linear, comet-like path
      SPLAT_RADIUS: 0.05,         // 40% thinner for a surgical comet head
      SPLAT_FORCE: 5000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 20,      // Slower, graceful color shifts
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true,
    };
    const BURST_CONFIG = {
      RADIUS: 0.65,               // Large, cinematic pulse
      FORCE: 9000,                // Soft, slow expansion
    };
    // Colour palette aligned with the portfolio:
    // blues (#0690d4), cyans, and soft purples — all at ~35% intensity
    const PALETTE = [
      { h: 0.72, s: 0.32, v: 0.78 },  // Muted violet
      { h: 0.78, s: 0.34, v: 0.80 },  // Soft purple
      { h: 0.85, s: 0.36, v: 0.82 },  // Subtle magenta
      { h: 0.92, s: 0.38, v: 0.85 },  // Gentle pink
      { h: 0.58, s: 0.28, v: 0.75 },  // Calm deep blue
      { h: 0.52, s: 0.30, v: 0.78 },  // Dusty blue
      { h: 0.48, s: 0.28, v: 0.76 },  // Faded teal
      { h: 0.10, s: 0.25, v: 0.80 },  // Soft warm dust
      { h: 0.51, s: 0.7, v: 1.0 }, // Vibrant ice-blue
    ];
    let paletteIndex = 0;
    function pickPaletteColor() {
      const entry = PALETTE[paletteIndex % PALETTE.length];
      paletteIndex++;
      return HSVtoRGB(entry.h + (Math.random() - 0.5) * 0.08, entry.s, entry.v);
    }
    // ─── helpers ──────────────────────────────────────────────────────────────
    function HSVtoRGB(h: number, s: number, v: number) {
      let r = 0, g = 0, b = 0;
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
      }
      // 0.10 opacity for 60% more translucency (very subtle & premium)
      const opacity = 0.30;
      return { r: r * opacity, g: g * opacity, b: b * opacity };
    }

    function scaleByPixelRatio(input: number) {
      return Math.floor(input * (window.devicePixelRatio || 1));
    }
    function wrap(value: number, min: number, max: number) {
      const range = max - min;
      if (range === 0) return min;
      return ((value - min) % range) + min;
    }
    // ─── WebGL context ───────────────────────────────────────────────────────
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params) as WebGLRenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) {
      gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as any;
    }

    if (!gl) return;
    const GL = gl as WebGLRenderingContext & {
      HALF_FLOAT?: number;
      R16F?: number; RG16F?: number; RGBA16F?: number;
      RG?: number; RED?: number;
    };
    let halfFloat: any;
    let supportLinearFiltering: any;
    if (isWebGL2) {
      GL.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = GL.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = GL.getExtension('OES_texture_half_float');
      supportLinearFiltering = GL.getExtension('OES_texture_half_float_linear');
    }
    GL.clearColor(0, 0, 0, 0); // O alpha for transparency
    const halfFloatTexType = isWebGL2 ? (GL as any).HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;
    function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
      const tex = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, tex);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      GL.texImage2D(GL.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = GL.createFramebuffer();
      GL.bindFramebuffer(GL.FRAMEBUFFER, fbo);
      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, tex, 0);
      return GL.checkFramebufferStatus(GL.FRAMEBUFFER) === GL.FRAMEBUFFER_COMPLETE;
    }
    function getSupportedFormat(internalFormat: number, format: number, type: number): { internalFormat: number; format: number } | null {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        if (isWebGL2) {
          if (internalFormat === (GL as any).R16F) return getSupportedFormat((GL as any).RG16F, (GL as any).RG, type);
          if (internalFormat === (GL as any).RG16F) return getSupportedFormat((GL as any).RGBA16F, GL.RGBA, type);
        }
        return null;
      }
      return { internalFormat, format };
    }
    let formatRGBA: any, formatRG: any, formatR: any;
    if (isWebGL2) {
      formatRGBA = getSupportedFormat((GL as any).RGBA16F, GL.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat((GL as any).RG16F, (GL as any).RG, halfFloatTexType);
      formatR = getSupportedFormat((GL as any).R16F, (GL as any).RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(GL.RGBA, GL.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(GL.RGBA, GL.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(GL.RGBA, GL.RGBA, halfFloatTexType);
    }
    if (!supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }
    // ─── shader helpers ───────────────────────────────────────────────────────
    function compileShader(type: number, source: string, keywords?: string[] | null) {
      if (keywords) {
        source = keywords.map(k => `#define ${k}`).join('\n') + '\n' + source;
      }
      const shader = GL.createShader(type)!;
      GL.shaderSource(shader, source);
      GL.compileShader(shader);
      if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        console.warn('Shader error:', GL.getShaderInfoLog(shader));
      }
      return shader;
    }
    function createProgram(vs: WebGLShader, fs: WebGLShader) {
      const program = GL.createProgram()!;
      GL.attachShader(program, vs);
      GL.attachShader(program, fs);
      GL.linkProgram(program);
      if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
        console.warn('Program error:', GL.getProgramInfoLog(program));
      }
      return program;
    }
    function getUniforms(program: WebGLProgram) {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = GL.getProgramParameter(program, GL.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = GL.getActiveUniform(program, i)!.name;
        uniforms[name] = GL.getUniformLocation(program, name);
      }
      return uniforms;
    }
    // ─── shader sources ───────────────────────────────────────────────────────
    const baseVertSrc = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform vec2 texelSize;
      void main(){
        vUv = aPosition*0.5+0.5;
        vL = vUv - vec2(texelSize.x,0);
        vR = vUv + vec2(texelSize.x,0);
        vT = vUv + vec2(0,texelSize.y);
        vB = vUv - vec2(0,texelSize.y);
        gl_Position = vec4(aPosition,0,1);
      }`;
    const copyFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; uniform sampler2D uTexture;
      void main(){ gl_FragColor = texture2D(uTexture, vUv); }`;
    const clearFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
      void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`;
    const splatFragSrc = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main(){
        vec2 p = vUv - point;
        p.x *= aspectRatio;
        float s = exp(-dot(p,p)/radius);
        vec4 base = texture2D(uTarget, vUv);
        gl_FragColor = vec4(base.rgb + s * color, clamp(base.a + s, 0.0, 1.0));
      }`;
    const advectionFragSrc = `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity; uniform sampler2D uSource;
      uniform vec2 texelSize; uniform vec2 dyeTexelSize;
      uniform float dt; uniform float dissipation;
      vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize){
        vec2 st=uv/tsize-0.5;
        vec2 iuv=floor(st); vec2 fuv=fract(st);
        vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*tsize);
        vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*tsize);
        vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*tsize);
        vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*tsize);
        return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);
      }
      void main(){
      #ifdef MANUAL_FILTERING
        vec2 coord=vUv - dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;
        vec4 result=bilerp(uSource,coord,dyeTexelSize);
      #else
        vec2 coord=vUv - dt*texture2D(uVelocity,vUv).xy*texelSize;
        vec4 result=texture2D(uSource,coord);
      #endif
        gl_FragColor = result/(1.0+dissipation*dt);
      }`;
    const divergenceFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uVelocity,vL).x; float R=texture2D(uVelocity,vR).x;
        float T=texture2D(uVelocity,vT).y; float B=texture2D(uVelocity,vB).y;
        vec2 C=texture2D(uVelocity,vUv).xy;
        if(vL.x<0.0){L=-C.x;} if(vR.x>1.0){R=-C.x;}
        if(vT.y>1.0){T=-C.y;} if(vB.y<0.0){B=-C.y;}
        gl_FragColor=vec4(0.5*(R-L+T-B),0,0,1);
      }`;
    const curlFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uVelocity,vL).y; float R=texture2D(uVelocity,vR).y;
        float T=texture2D(uVelocity,vT).x; float B=texture2D(uVelocity,vB).x;
        gl_FragColor=vec4(0.5*(R-L-T+B),0,0,1);
      }`;
    const vorticityFragSrc = `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uVelocity; uniform sampler2D uCurl;
      uniform float curl; uniform float dt;
      void main(){
        float L=texture2D(uCurl,vL).x; float R=texture2D(uCurl,vR).x;
        float T=texture2D(uCurl,vT).x; float B=texture2D(uCurl,vB).x;
        float C=texture2D(uCurl,vUv).x;
        vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
        force/=length(force)+0.0001;
        force*=curl*C; force.y*=-1.0;
        vec2 vel=texture2D(uVelocity,vUv).xy+force*dt;
        vel=min(max(vel,-1000.0),1000.0);
        gl_FragColor=vec4(vel,0,1);
      }`;
    const pressureFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uDivergence;
      void main(){
        float L=texture2D(uPressure,vL).x; float R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x; float B=texture2D(uPressure,vB).x;
        float div=texture2D(uDivergence,vUv).x;
        gl_FragColor=vec4((L+R+B+T-div)*0.25,0,0,1);
      }`;
    const gradSubFragSrc = `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uPressure,vL).x; float R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x; float B=texture2D(uPressure,vB).x;
        vec2 vel=texture2D(uVelocity,vUv).xy;
        vel.xy-=vec2(R-L,T-B);
        gl_FragColor=vec4(vel,0,1);
      }`;
    const displayFragSrc = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      // Pseudo-random noise for stardust effect
      float noise(vec2 p){
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main(){
        vec3 c = texture2D(uTexture, vUv).rgb;
        float alpha = max(c.r, max(c.g, c.b));
        
        // Add subtle stardust grain
        float n = noise(vUv * 500.0) * 0.08;
        vec3 color = c + n * alpha;
        
        gl_FragColor = vec4(color, alpha);
      }`;
    // ─── compile programs ─────────────────────────────────────────────────────
    const baseVS = compileShader(GL.VERTEX_SHADER, baseVertSrc);
    const copyProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, copyFragSrc));
    const clearProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, clearFragSrc));
    const splatProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, splatFragSrc));
    const advProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, advectionFragSrc,
      supportLinearFiltering ? null : ['MANUAL_FILTERING']));
    const divProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, divergenceFragSrc));
    const curlProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, curlFragSrc));
    const vortProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, vorticityFragSrc));
    const pressProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, pressureFragSrc));
    const gradSubProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, gradSubFragSrc));
    const displayProg = createProgram(baseVS, compileShader(GL.FRAGMENT_SHADER, displayFragSrc));
    const copyU = getUniforms(copyProg);
    const clearU = getUniforms(clearProg);
    const splatU = getUniforms(splatProg);
    const advU = getUniforms(advProg);
    const divU = getUniforms(divProg);
    const curlU = getUniforms(curlProg);
    const vortU = getUniforms(vortProg);
    const pressU = getUniforms(pressProg);
    const gradSubU = getUniforms(gradSubProg);
    const displayU = getUniforms(displayProg);
    // ─── blit quad ────────────────────────────────────────────────────────────
    GL.bindBuffer(GL.ARRAY_BUFFER, GL.createBuffer());
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), GL.STATIC_DRAW);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, GL.createBuffer());
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), GL.STATIC_DRAW);
    GL.vertexAttribPointer(0, 2, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(0);
    function blit(target: any, clear = false) {
      if (!target) {
        GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
        GL.bindFramebuffer(GL.FRAMEBUFFER, null);
      } else {
        GL.viewport(0, 0, target.width, target.height);
        GL.bindFramebuffer(GL.FRAMEBUFFER, target.fbo);
      }
      if (clear) { GL.clearColor(0, 0, 0, 1); GL.clear(GL.COLOR_BUFFER_BIT); }
      GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    }
    // ─── FBO helpers ──────────────────────────────────────────────────────────
    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      GL.activeTexture(GL.TEXTURE0);
      const texture = GL.createTexture()!;
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, param);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, param);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      GL.texImage2D(GL.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = GL.createFramebuffer()!;
      GL.bindFramebuffer(GL.FRAMEBUFFER, fbo);
      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
      GL.viewport(0, 0, w, h);
      GL.clearColor(0, 0, 0, 0);
      GL.clear(GL.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) {
          GL.activeTexture(GL.TEXTURE0 + id);
          GL.bindTexture(GL.TEXTURE_2D, texture);
          return id;
        }
      };
    }
    function createDoubleFBO(w: number, h: number, iF: number, f: number, t: number, p: number) {
      let fbo1 = createFBO(w, h, iF, f, t, p);
      let fbo2 = createFBO(w, h, iF, f, t, p);
      return {
        width: w, height: h,
        texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; },
        set read(v) { fbo1 = v; },
        get write() { return fbo2; },
        set write(v) { fbo2 = v; },
        swap() { const tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }
      };
    }
    function resizeFBO(target: any, w: number, h: number, iF: number, f: number, t: number, p: number) {
      const newFBO = createFBO(w, h, iF, f, t, p);
      GL.useProgram(copyProg);
      GL.uniform1i(copyU.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }
    function resizeDoubleFBO(target: any, w: number, h: number, iF: number, f: number, t: number, p: number) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, iF, f, t, p);
      target.write = createFBO(w, h, iF, f, t, p);
      target.width = w; target.height = h;
      target.texelSizeX = 1 / w; target.texelSizeY = 1 / h;
      return target;
    }
    function getResolution(res: number) {
      let ar = GL.drawingBufferWidth / GL.drawingBufferHeight;
      if (ar < 1) ar = 1 / ar;
      const min = Math.round(res);
      const max = Math.round(res * ar);
      return GL.drawingBufferWidth > GL.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    }
    // ─── init framebuffers ────────────────────────────────────────────────────
    let dye: any, velocity: any, divergence: any, curlFBO: any, pressure: any;
    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = halfFloatTexType;
      const rgba = formatRGBA;
      const rg = formatRG;
      const r = formatR;
      const filtering = supportLinearFiltering ? GL.LINEAR : GL.NEAREST;
      GL.disable(GL.BLEND);
      if (!dye) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      if (!velocity) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      else velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, GL.NEAREST);
      curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, GL.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, GL.NEAREST);
    }
    // ─── canvas resize ────────────────────────────────────────────────────────
    function resizeCanvas() {
      const w = scaleByPixelRatio(canvas!.clientWidth);
      const h = scaleByPixelRatio(canvas!.clientHeight);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        return true;
      }
      return false;
    }
    // ─── pointer ──────────────────────────────────────────────────────────────
    interface Pointer {
      texcoordX: number; texcoordY: number;
      prevTexcoordX: number; prevTexcoordY: number;
      deltaX: number; deltaY: number;
      moved: boolean;
      color: { r: number; g: number; b: number };
    }
    const pointer: Pointer = {
      texcoordX: 0, texcoordY: 0,
      prevTexcoordX: 0, prevTexcoordY: 0,
      deltaX: 0, deltaY: 0,
      moved: false,
      color: pickPaletteColor(),
    };

    function correctRadius(r: number) {
      const ar = canvas!.width / canvas!.height;
      return ar > 1 ? r * ar : r;
    }
    function correctDeltaX(d: number) {
      const ar = canvas!.width / canvas!.height;
      return ar < 1 ? d * ar : d;
    }
    function correctDeltaY(d: number) {
      const ar = canvas!.width / canvas!.height;
      return ar > 1 ? d / ar : d;
    }
    function updatePointerMove(posX: number, posY: number) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas!.width;
      pointer.texcoordY = 1 - posY / canvas!.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }
    // ─── splat ────────────────────────────────────────────────────────────────
    function splat(x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }, radiusScale = 1.0) {
      GL.useProgram(splatProg);
      GL.uniform1i(splatU.uTarget, velocity.read.attach(0));
      GL.uniform1f(splatU.aspectRatio, canvas!.width / canvas!.height);
      GL.uniform2f(splatU.point, x, y);
      GL.uniform3f(splatU.color, dx, dy, 0);
      GL.uniform1f(splatU.radius, correctRadius((config.SPLAT_RADIUS * radiusScale) / 100));
      blit(velocity.write);
      velocity.swap();
      GL.uniform1i(splatU.uTarget, dye.read.attach(0));
      // Boost color intensity for splats
      GL.uniform3f(splatU.color, color.r * radiusScale, color.g * radiusScale, color.b * radiusScale);
      blit(dye.write);
      dye.swap();
    }
    function splatPointer() {
      if (!pointer.moved) return;
      pointer.moved = false;
      const dx = pointer.deltaX * config.SPLAT_FORCE;
      const dy = pointer.deltaY * config.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }
    function clickBurst() {
      const color = pickPaletteColor();
      // Cinematic slow expansion: Large radius, low force
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dx = Math.cos(angle) * BURST_CONFIG.FORCE;
        const dy = Math.sin(angle) * BURST_CONFIG.FORCE;
        // Large, soft, slow-expanding wisps
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color, 0.000000000000000000000000001);
      }
      // Secondary delayed "echo" for depth
      setTimeout(() => {
        if (!canvasRef.current) return;
        splat(pointer.texcoordX, pointer.texcoordY, 0, 0, color, 1.0);
      }, 100);
    }
    // ─── simulation step ──────────────────────────────────────────────────────
    function step(dt: number) {
      GL.disable(GL.BLEND);
      GL.useProgram(curlProg);
      GL.uniform2f(curlU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      GL.uniform1i(curlU.uVelocity, velocity.read.attach(0));
      blit(curlFBO);
      GL.useProgram(vortProg);
      GL.uniform2f(vortU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      GL.uniform1i(vortU.uVelocity, velocity.read.attach(0));
      GL.uniform1i(vortU.uCurl, curlFBO.attach(1));
      GL.uniform1f(vortU.curl, config.CURL);
      GL.uniform1f(vortU.dt, dt);
      blit(velocity.write);
      velocity.swap();
      GL.useProgram(divProg);
      GL.uniform2f(divU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      GL.uniform1i(divU.uVelocity, velocity.read.attach(0));
      blit(divergence);
      GL.useProgram(clearProg);
      GL.uniform1i(clearU.uTexture, pressure.read.attach(0));
      GL.uniform1f(clearU.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();
      GL.useProgram(pressProg);
      GL.uniform2f(pressU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      GL.uniform1i(pressU.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        GL.uniform1i(pressU.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }
      GL.useProgram(gradSubProg);
      GL.uniform2f(gradSubU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      GL.uniform1i(gradSubU.uPressure, pressure.read.attach(0));
      GL.uniform1i(gradSubU.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();
      GL.useProgram(advProg);
      GL.uniform2f(advU.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering) GL.uniform2f(advU.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      const vId = velocity.read.attach(0);
      GL.uniform1i(advU.uVelocity, vId);
      GL.uniform1i(advU.uSource, vId);
      GL.uniform1f(advU.dt, dt);
      GL.uniform1f(advU.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();
      if (!supportLinearFiltering) GL.uniform2f(advU.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      GL.uniform1i(advU.uVelocity, velocity.read.attach(0));
      GL.uniform1i(advU.uSource, dye.read.attach(1));
      GL.uniform1f(advU.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }
    function render() {
      GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
      GL.bindFramebuffer(GL.FRAMEBUFFER, null);
      GL.clearColor(0, 0, 0, 0);
      GL.clear(GL.COLOR_BUFFER_BIT);
      GL.enable(GL.BLEND);
      GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
      GL.useProgram(displayProg);
      GL.uniform1i(displayU.uTexture, dye.read.attach(0));
      // Pass texelSize for Chromatic Aberration
      GL.uniform2f(displayU.texelSize, 1.0 / canvas!.width, 1.0 / canvas!.height);
      blit(null);
    }
    // ─── colour cycling ───────────────────────────────────────────────────────
    let colorTimer = 0;
    function updateColors(dt: number) {
      colorTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorTimer >= 1) {
        colorTimer = wrap(colorTimer, 0, 1);
        pointer.color = pickPaletteColor();
      }
    }
    // ─── animation loop ───────────────────────────────────────────────────────
    let lastTime = Date.now();
    let rafId = 0;
    function update() {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1700, 0.016666);
      lastTime = now;
      if (resizeCanvas()) initFramebuffers();
      updateColors(dt);
      splatPointer();
      step(dt);
      render();
      rafId = requestAnimationFrame(update);
    }
    initFramebuffers();
    update();
    // ─── events ───────────────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerMove(posX, posY);
    }
    function onTouchMove(e: TouchEvent) {
      for (let i = 0; i < e.targetTouches.length; i++) {
        const t = e.targetTouches[i];
        updatePointerMove(scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY));
      }
    }
    function onMouseDown(e: MouseEvent) {
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerMove(posX, posY);
      clickBurst();
    }
    function onTouchStart(e: TouchEvent) {
      if (e.targetTouches.length > 0) {
        const t = e.targetTouches[0];
        updatePointerMove(scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY));
        clickBurst();
      }
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('touchstart', onTouchStart);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      id="fluid-trail"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100dvw',
        height: '100dvh',
        pointerEvents: 'none',
        zIndex: 50,            // Above background, but below important UI overrides
        display: activePortalId ? 'none' : 'block',
      }}
    />
  );
};
export default FluidCursorTrail;
