#!/usr/bin/env bash
# build-ruz.sh — render de alta calidad para video-pizarra (Ruz Inmobiliaria). Reemplaza a build.sh.
# Uso: ./build-ruz.sh <nombre>            (30 fps, ~3–5 min por minuto de video)
#      FPS=60 ./build-ruz.sh <nombre>     (más fluido, ~2.5x más lento; solo si la persona pide máxima fluidez)
# Mejoras: captura casi sin pérdida + master CRF 18 preset slow (una sola pasada); copia móvil con el bitrate más alto que cabe en ~28 MB (antes fijo a 2.6 Mbps),
# nitidez suave, color BT.709 y audio normalizado a −14 LUFS.
set -e
NAME=${1:-video}; FPS=${FPS:-30}
mkdir -p audio; MUSIC=audio/music.mp3; [ -f "$MUSIC" ] || MUSIC=""
# captura rápida casi sin pérdida (la compresión de calidad se hace una sola vez al final)
sed -i "s/'-preset', 'medium', '-crf', '18'/'-preset', 'veryfast', '-crf', '12'/; s/'-preset', 'slow', '-crf', '15'/'-preset', 'veryfast', '-crf', '12'/" render.mjs
node render.mjs "_$NAME-silent.mp4" --mode A --fps "$FPS"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "_$NAME-silent.mp4")
PY=python3; [ -x .venv/bin/python ] && PY=.venv/bin/python
SWELL=1 $PY sfx_mix.py "$D" "audio/_$NAME-mix.wav" $MUSIC
ffmpeg -y -v error -i "_$NAME-silent.mp4" -i "audio/_$NAME-mix.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$NAME.mp4"
# copia para celular/WhatsApp: bitrate máximo que cabe en ~28 MB (tope 9 Mbps)
BR=$(python3 -c "print(max(2600, min(9000, int(28*8192/float('$D') - 140))))")
VF="unsharp=3:3:0.35,format=yuv420p"
ffmpeg -y -v error -i "$NAME.mp4" -vf "$VF" -c:v libx264 -preset slow -b:v ${BR}k -maxrate $((BR*3/2))k -bufsize $((BR*2))k \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -pass 1 -an -f mp4 /dev/null
ffmpeg -y -v error -i "$NAME.mp4" -vf "$VF" -c:v libx264 -preset slow -b:v ${BR}k -maxrate $((BR*3/2))k -bufsize $((BR*2))k \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -pass 2 -c:a aac -b:a 160k -movflags +faststart "$NAME-movil.mp4"
rm -f ffmpeg2pass* "_$NAME-silent.mp4"
echo "LISTO: $NAME.mp4 ($(du -h "$NAME.mp4" | cut -f1)) · $NAME-movil.mp4 ($(du -h "$NAME-movil.mp4" | cut -f1), ${BR} kbps) · ${D}s · ${FPS} fps"
