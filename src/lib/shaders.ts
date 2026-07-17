export const VERTEX_SHADER = /* glsl */`#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

export const FRAGMENT_SHADER = /* glsl */`#version 300 es
precision highp float;

const int MAX_BLOBS = 16;

uniform vec2  u_resolution;
uniform vec3  u_bgColor;
uniform int   u_blobCount;
uniform vec2  u_positions[MAX_BLOBS];
uniform vec3  u_colors[MAX_BLOBS];
uniform float u_radii[MAX_BLOBS];
uniform float u_spread;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y; // flip Y to match screen-space origin

  // Aspect-correct distances so blobs stay circular regardless of canvas ratio
  float aspect = u_resolution.x / u_resolution.y;

  float totalWeight  = 0.0;
  vec3  weightedColor = vec3(0.0);

  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= u_blobCount) break;

    // u_radii[i] is normalized to canvas height, so distances are in H units
    vec2  d    = vec2((uv.x - u_positions[i].x) * aspect, uv.y - u_positions[i].y);
    float dist = length(d);
    float sigma = u_radii[i] * u_spread;
    float w    = exp(-dist * dist / (2.0 * sigma * sigma));

    totalWeight   += w;
    weightedColor += u_colors[i] * w;
  }

  vec3 col = u_bgColor;
  if (totalWeight > 0.0001) {
    col = mix(u_bgColor, weightedColor / totalWeight, clamp(totalWeight, 0.0, 1.0));
  }

  fragColor = vec4(col, 1.0);
}`
