'use client'

import { useEffect, useRef, useCallback } from 'react'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '@/lib/shaders'
import type { GradientSettings } from '@/lib/types'
import { hexToRgb } from '@/lib/colorUtils'

const MAX_BLOBS = 16

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

export function useWebGL(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef      = useRef<WebGL2RenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const locsRef    = useRef<Record<string, WebGLUniformLocation | null>>({})
  const readyRef   = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true })
    if (!gl) { console.error('WebGL2 not supported'); return }
    glRef.current = gl

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog))
      return
    }
    programRef.current = prog

    locsRef.current = {
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_bgColor:    gl.getUniformLocation(prog, 'u_bgColor'),
      u_blobCount:  gl.getUniformLocation(prog, 'u_blobCount'),
      u_positions:  gl.getUniformLocation(prog, 'u_positions'),
      u_colors:     gl.getUniformLocation(prog, 'u_colors'),
      u_radii:      gl.getUniformLocation(prog, 'u_radii'),
      u_spread:     gl.getUniformLocation(prog, 'u_spread'),
    }

    // Full-screen quad
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    readyRef.current = true

    return () => {
      readyRef.current = false
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const render = useCallback((settings: GradientSettings) => {
    const gl   = glRef.current
    const prog = programRef.current
    const canvas = canvasRef.current
    if (!gl || !prog || !canvas || !readyRef.current) return

    const locs = locsRef.current
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(prog)

    const bg = hexToRgb(settings.backgroundColor)
    gl.uniform2f(locs.u_resolution, canvas.width, canvas.height)
    gl.uniform3f(locs.u_bgColor, bg[0], bg[1], bg[2])
    gl.uniform1i(locs.u_blobCount, Math.min(settings.blobs.length, MAX_BLOBS))
    gl.uniform1f(locs.u_spread, settings.spread)

    const positions = new Float32Array(MAX_BLOBS * 2)
    const colors    = new Float32Array(MAX_BLOBS * 3)
    const radii     = new Float32Array(MAX_BLOBS)

    settings.blobs.slice(0, MAX_BLOBS).forEach((blob, i) => {
      positions[i * 2]     = blob.x
      positions[i * 2 + 1] = blob.y
      const c = hexToRgb(settings.useGlobalColor ? settings.globalColor : blob.color)
      colors[i * 3]     = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]
      radii[i] = blob.radius
    })

    gl.uniform2fv(locs.u_positions, positions)
    gl.uniform3fv(locs.u_colors, colors)
    gl.uniform1fv(locs.u_radii, radii)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }, [canvasRef])

  return { render }
}
