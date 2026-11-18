#!/bin/bash
# Assemble the single-file game page from the parts in src/, in order, and syntax-check the script.
set -e
cd "$(dirname "$0")"
PARTS=$(cat src/ORDER)
cat $(for p in $PARTS; do echo src/$p; done) > dist/index.html
python3 - <<'PY'
s=open('dist/index.html').read()
i=s.index('<div id="app"></div>');j=s.index('<script>',i);k=s.rindex('</script>')
open('/tmp/twd_check.js','w').write(s[j+8:k])
PY
node --check /tmp/twd_check.js && echo "BUILD_OK $(wc -c < dist/index.html) bytes"
