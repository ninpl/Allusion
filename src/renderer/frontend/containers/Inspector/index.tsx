import React, { useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import fs from 'fs';
import path from 'path';
import { observer } from 'mobx-react-lite';

import StoreContext from '../../contexts/StoreContext';
import ImageInfo from '../../components/ImageInfo';
import FileTags from '../../components/FileTag';
import { ClientFile } from '../../../entities/File';
import { clamp } from '@blueprintjs/core/lib/esm/common/utils';
import { CSSTransition } from 'react-transition-group';
import { H5, H6 } from '@blueprintjs/core';

const sufixes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const getBytesHumanReadable = (bytes: number) => {
  if (bytes <= 0) {
    return '0 Bytes';
  }
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sufixes[i];
};

const MultiFileInfo = observer(({ files }: { files: ClientFile[] }) => {
  return (
    <section>
      <p>Selected {files.length} files</p>
    </section>
  );
});

const Carousel = ({ items }: { items: ClientFile[] }) => {
  // NOTE: maxItems is coupled to the CSS! Max is 10 atm (see inspector.scss)
  const maxItems = 7;
  const [scrollIndex, setScrollIndex] = useState(0);

  // Add some padding items so that you can scroll the last item to the front
  const paddedItems = useMemo(() => {
    const padding = Array.from(Array(maxItems - 1));
    setScrollIndex(items.length - 1);
    return [...padding, ...items];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const delta = e.deltaY > 0 ? -1 : 1;
      setScrollIndex((v) => clamp(v + delta, 0, paddedItems.length - 1));
    },
    [paddedItems.length],
  );

  return (
    <div id="carousel" onWheel={handleWheel}>
      {/* Show a stack of the first N images (or fewer) */}
      {paddedItems.slice(scrollIndex, scrollIndex + maxItems).map((file, index) =>
        !file ? null : (
          <div
            key={file.id}
            className={`item child-${
              index
              // TODO: Could add in and out transition, but you'd also need to know the scroll direction for that
              // }${index === 0 ? ' item-enter' : ''
              // }${index === maxItems - 1 ? ' item-exit' : ''
            }`}
          >
            {/* TODO: Thumbnail path is not always resolved atm, working on that in another branch */}
            <img
              src={file.thumbnailPath}
              onClick={() => setScrollIndex(scrollIndex - maxItems + 1 + index)}
            />
          </div>
        ),
      )}
    </div>
  );
};

const Inspector = observer(() => {
  const { uiStore } = useContext(StoreContext);
  const selectedFiles = uiStore.clientFileSelection;

  let selectionPreview;
  let headerElem;
  let headerSubtext;

  if (selectedFiles.length === 0) {
    headerElem = <H6 muted><i>No image selected</i></H6>;
  } else if (selectedFiles.length === 1) {
    const singleFile = selectedFiles[0];
    const ext = singleFile.absolutePath
      .substr(singleFile.absolutePath.lastIndexOf('.') + 1)
      .toUpperCase();
    selectionPreview = (
      <img
        src={singleFile.absolutePath}
        style={{ cursor: uiStore.isSlideMode ? undefined : 'zoom-in' }}
        onClick={uiStore.enableSlideMode}
      />
    );
    headerElem = <H5>{path.basename(singleFile.absolutePath)}</H5>;
    headerSubtext = `${ext} image - ${getBytesHumanReadable(fs.statSync(singleFile.absolutePath).size)}`;
  } else {
    // Todo: fs.stat (not sync) is preferred, but it seems to execute instantly... good enough for now
    // TODO: This will crash the app if the image can't be found - same for the other case a few lines earlier
    const size = selectedFiles.reduce((sum, f) => sum + fs.statSync(f.absolutePath).size, 0);

    // Stack effects: https://tympanus.net/codrops/2014/03/05/simple-stack-effects/
    // TODO: Would be nice to hover over an image and that all images before that get opacity 0.1
    // Or their transform is adjusted so they're more spread apart or something
    // TODO: Maybe a dropshadow?
    selectionPreview = (
      // <figure id="stack" className="stack-queue">
      //   {/* Show a stack of the first 5 images (with some css magic - the 5 limit is also hard coded in there) */}
      //   {selectedFiles.slice(0, 5).map((file) => (
      //     <img src={file.thumbnailPath} key={file.id} />
      //   ))}
      // </figure>
      <Carousel items={selectedFiles} />
    );
    headerElem = <H5>{`${selectedFiles[0].name} and ${selectedFiles.length - 1} more`}</H5>;
    headerSubtext = getBytesHumanReadable(size);
  }

  let content: ReactNode;

  if (selectedFiles.length > 0) {
    content = (
      <>
        <section id="filePreview">{selectionPreview}</section>

        <section id="fileOverview">
          {headerElem}
          <small>{headerSubtext}</small>
        </section>

        {selectedFiles.length === 1 ? (
          <ImageInfo file={selectedFiles[0]} />
        ) : (
          <MultiFileInfo files={selectedFiles} />
        )}
        <FileTags files={selectedFiles} />
      </>
    );
  } else {
    content= (
      <>
        <section id="filePreview" />
        <section id="fileOverview">
          <div className="inpectorHeading">{headerElem}</div>
        </section>
      </>
    );
  }
  return (
    // Note: timeout needs to equal the transition time in CSS
    <CSSTransition in={uiStore.isInspectorOpen} classNames="sliding-sidebar" timeout={200} unmountOnExit>
      <aside id="inspector">
        {content}
      </aside>
    </CSSTransition>
  )
});

export default Inspector;
