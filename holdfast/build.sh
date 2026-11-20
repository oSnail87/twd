#!/bin/bash
# Assemble the single-file game page from the parts in src/, in order, and syntax-check the script.
set -e
cd "$(dirname "$0")"
cat src/00_head.html src/10_data.js src/20_sim.js src/22_ground.js src/25_orders.js src/27_dead.js src/28_wild.js src/30_inv.js src/35_mind.js src/40_ai.js src/45_act.js src/50_world.js src/60_ui.js src/62_hands.js src/65_scene.js src/70_build.js src/90_boot.js > dist/index.html
python3 - <<'PY'
s=open('dist/index.html').read()
i=s.index('three.min.js"></script>');j=s.index('<script>',i);k=s.rindex('</script>')
open('/tmp/holdfast_check.js','w').write(s[j+8:k])
PY
node --check /tmp/holdfast_check.js && echo "BUILD_OK $(wc -c < dist/index.html) bytes"
