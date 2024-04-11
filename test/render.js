let canvas = document.querySelector('canvas');
let input = document.querySelector('#base64');
sketchEditor.ca.preserveDrawingBuffer = true;

fetch('./sketch.sketch')
  .then((res) => {
    return res.arrayBuffer();
  })
  .then((buff) => {
    sketchEditor
      .openAndConvertSketchBuffer(buff)
      .then(json => {
        const dpi = 2;
        const { clientWidth, clientHeight } = canvas;
        const root = window.root = sketchEditor.parse(json, canvas, dpi);
        root.setPageIndex(json.currentPageIndex || 0);
        root.on(sketchEditor.node.Root.REFRESH_COMPLETE, () => {
          input.value = canvas.toDataURL();
        });
      });
  });

