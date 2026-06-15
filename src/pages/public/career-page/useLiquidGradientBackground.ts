import { useEffect, type RefObject } from "react";

import { assetUrl } from "./utils";

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_imgRes;
uniform sampler2D u_tex;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+10.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod289v2(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m;m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 ox=floor(x+.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}

vec2 coverUV(vec2 uv){
  float imgAspect=max(u_imgRes.x,1.0)/max(u_imgRes.y,1.0);
  float screenAspect=u_res.x/u_res.y;
  vec2 outUV=uv;
  if(screenAspect>imgAspect){
    float visibleH=imgAspect/screenAspect;
    outUV.y=(uv.y-.5)*visibleH+.5;
  }else{
    float visibleW=screenAspect/imgAspect;
    outUV.x=(uv.x-.5)*visibleW+.5;
  }
  return clamp(outUV,0.0,1.0);
}

vec3 sampleFrame(vec2 uv){
  return texture2D(u_tex,coverUV(uv)).rgb;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float t=u_time*.68;
  float ramp=smoothstep(.0,.85,u_time);
  vec2 flowP=uv;
  float n1=snoise(flowP*1.0+vec2(t*.48,-t*.34));
  float n2=snoise(flowP*1.55+vec2(-t*.38,t*.44));
  float n3=snoise(flowP*2.1+vec2(t*.28,t*.18));
  vec2 curl=vec2(n1*.082+n3*.031,n2*.068-n1*.034);
  vec2 warped=uv+vec2(n1*.055+n3*.02,n2*.04);
  float darkX=.43+.115*sin(t*.72)+.035*sin(t*1.37);
  float darkMask=1.0-smoothstep(.0,.28,abs(warped.x-darkX));
  darkMask*=smoothstep(-.12,.18,uv.y)*smoothstep(1.12,.72,uv.y);
  vec2 glowCenter=vec2(.72+.105*sin(t*.62),.5+.055*cos(t*.86));
  float glowMask=1.0-smoothstep(.0,.78,length((warped-glowCenter)*vec2(.58,.86)));
  float sweep=1.0-smoothstep(.0,.22,abs(warped.x-(.58+.18*sin(t*.5))));
  sweep*=smoothstep(.02,.28,uv.y)*smoothstep(1.05,.62,uv.y);
  vec2 darkPull=vec2(-.105*sin(t*.72),.03*sin(t*.55))*darkMask;
  vec2 glowPull=vec2(-.095*sin(t*.62),-.052*cos(t*.86))*glowMask;
  vec2 texUV=uv+ramp*(curl+darkPull+glowPull);
  vec3 base=sampleFrame(uv);
  vec3 moved=sampleFrame(texUV);
  vec3 col=mix(base,moved,ramp*.92);
  float darkBreath=(.7+.12*(.5+.5*sin(t*1.45)))*darkMask*ramp;
  float glowBreath=(.08+.08*(.5+.5*cos(t*1.3)))*glowMask*ramp;
  float sweepBreath=(.06+.04*(.5+.5*sin(t*.9)))*sweep*ramp;
  col=mix(col,vec3(.0,.025,.16),darkBreath*.32);
  col=mix(col,vec3(.76,.94,.98),glowBreath);
  col=mix(col,vec3(.35,.78,1.0),sweepBreath);
  gl_FragColor=vec4(col,1.0);
}
`;

const compileShader = (gl: WebGLRenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export const useLiquidGradientBackground = (
  containerRef: RefObject<HTMLDivElement | null>,
  heroRef: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    const container = containerRef.current;
    const heroEl = heroRef.current;
    if (!container || !heroEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none;";
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

    const vShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      "attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0,1); }",
    );
    const fShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vShader || !fShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uImgRes = gl.getUniformLocation(program, "u_imgRes");
    const uTex = gl.getUniformLocation(program, "u_tex");
    gl.uniform2f(uImgRes, 1919, 596);
    gl.uniform1i(uTex, 0);

    let textureReady = false;
    let paused = reduced.matches;
    let startTime = performance.now();
    let rafId = 0;

    const texture = gl.createTexture();
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      container.classList.add("isReady");
      if (!paused) start();
      else renderStatic();
    };
    image.src = assetUrl("hero-gradient-first-frame.png");

    const resize = () => {
      const heroRect = heroEl.getBoundingClientRect();
      container.style.top = `${heroRect.top}px`;
      container.style.height = `${heroRect.height}px`;

      const w = window.innerWidth;
      const h = heroRect.height || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cw = Math.max(1, Math.floor(w * dpr));
      const ch = Math.max(1, Math.floor(h * dpr));
      canvas.width = cw;
      canvas.height = ch;
      gl.viewport(0, 0, cw, ch);
      gl.useProgram(program);
      gl.uniform2f(uRes, cw, ch);
    };

    const renderStatic = () => {
      if (!textureReady) return;
      gl.useProgram(program);
      gl.uniform1f(uTime, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = () => {
      if (!paused && textureReady) {
        const elapsed = (performance.now() - startTime) * 0.001;
        gl.useProgram(program);
        gl.uniform1f(uTime, elapsed);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      rafId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      startTime = performance.now();
      paused = false;
    };

    const onScroll = () => {
      const heroRect = heroEl.getBoundingClientRect();
      container.style.top = `${heroRect.top}px`;
      container.style.height = `${heroRect.height}px`;
      container.style.display = heroRect.bottom < 0 ? "none" : "";
    };

    const onReducedChange = () => {
      if (reduced.matches) {
        paused = true;
        renderStatic();
      } else {
        start();
      }
    };

    const onVisibilityChange = () => {
      paused = document.hidden || reduced.matches;
      if (!paused) startTime = performance.now();
    };

    resize();
    rafId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", onReducedChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", onReducedChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.remove();
    };
  }, [containerRef, heroRef]);
};
